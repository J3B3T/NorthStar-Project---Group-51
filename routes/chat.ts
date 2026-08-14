import { Router, Response } from 'express';
import { getGenAI, executeToolCall, withTimeout, lookupOrderTool, checkReturnEligibilityTool, escalateToHumanTool } from '../services/gemini';
import { processFallbackChat } from '../services/fallback';
import { getCurrentOrders, setCurrentOrders } from './orders';
import { getCurrentAnalytics } from './analytics';
import { validateChatBody, sanitizeString } from '../middleware/validation';
import { rateLimit } from '../middleware/rateLimit';
import { ChatResponse } from '../types/server';
import { Order } from '../src/types';

const router = Router();

// Apply rate limiting and validation to chat endpoint
router.post('/', rateLimit, validateChatBody, async (req, res: Response) => {
  try {
    const { messages, userMessage } = req.body;
    const ai = getGenAI();

    // Track analytics count
    const analytics = getCurrentAnalytics();
    analytics.totalConversations += 1;

    if (!ai) {
      // Fallback deterministic logic if GEMINI_API_KEY is not set or unavailable
      const currentOrders = getCurrentOrders();
      const fallbackResponse = processFallbackChat(userMessage, messages || [], currentOrders, analytics);
      return res.json(fallbackResponse);
    }

    // Sanitize user message
    const sanitizedMessage = sanitizeString(userMessage);

    // Format conversation history for Gemini
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    if (Array.isArray(messages)) {
      for (const m of messages) {
        if (m.sender === 'user') {
          contents.push({ role: 'user', parts: [{ text: m.text }] });
        } else if (m.sender === 'assistant') {
          contents.push({ role: 'model', parts: [{ text: m.text }] });
        }
      }
    }
    // Append current user message
    contents.push({ role: 'user', parts: [{ text: sanitizedMessage }] });

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents,
        config: {
          systemInstruction: getSystemInstruction(),
          temperature: 0.2,
          tools: [{ functionDeclarations: [lookupOrderTool, checkReturnEligibilityTool, escalateToHumanTool] }],
        },
      }),
      30000
    );

    // Check if Gemini invoked any tool calls
    const functionCalls = response.functionCalls;
    let finalOrderContext: Order | null = null;
    let isEscalated = false;
    let escalationReason = '';

    if (functionCalls && functionCalls.length > 0) {
      const currentOrders = getCurrentOrders();
      const toolCall = functionCalls[0];
      const toolExec = await executeToolCall(toolCall.name, toolCall.args, currentOrders);

      if (toolExec.orderContext) finalOrderContext = toolExec.orderContext;
      if (toolExec.isEscalated) {
        isEscalated = true;
        escalationReason = toolExec.escalationReason || 'Specialist assistance required';
      }

      // Append function call and response to conversation for final grounded response
      const toolContent = [
        ...contents,
        {
          role: 'model',
          parts: [{ functionCall: { name: toolCall.name, args: toolCall.args } }],
        },
        {
          role: 'user',
          parts: [
            {
              functionResponse: {
                name: toolCall.name,
                response: toolExec.result,
              },
            },
          ],
        },
      ];

      const secondResponse = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: toolContent,
          config: {
            systemInstruction: getSystemInstruction(),
            temperature: 0.2,
          },
        }),
        30000
      );

      const replyText = secondResponse.text || "I'm here to help with your order status or return.";

      // Update analytics
      if (isEscalated) {
        analytics.escalatedCount += 1;
        analytics.intentBreakdown.escalated += 1;
        // Log ticket
        const ticketId = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
        analytics.recentTickets.unshift({
          ticketId,
          orderNumber: finalOrderContext?.orderNumber,
          customerName: finalOrderContext?.customerName || 'Customer',
          reason: escalationReason,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          status: 'Pending',
          conversationSnippet: [
            `Customer: ${sanitizedMessage}`,
            `Assistant: ${replyText}`,
          ],
        });
      } else {
        analytics.deflectedCount += 1;
        if (sanitizedMessage.toLowerCase().includes('return') || sanitizedMessage.toLowerCase().includes('refund')) {
          analytics.intentBreakdown.returnsRefunds += 1;
        } else {
          analytics.intentBreakdown.orderStatus += 1;
        }
      }
      analytics.deflectionRate = Number(
        ((analytics.deflectedCount / Math.max(1, analytics.totalConversations)) * 100).toFixed(1)
      );

      return res.json({
        text: replyText,
        orderContext: finalOrderContext,
        isEscalated,
        escalationReason: isEscalated ? escalationReason : undefined,
      } as ChatResponse);
    }

    const replyText = response.text || "Hello! 👋 Welcome to Northstar Retail Support. How can I help you today?";

    // Check if reply text indicates escalation
    if (replyText.toLowerCase().includes('connect you with') || replyText.toLowerCase().includes('support specialist')) {
      isEscalated = true;
      escalationReason = 'Escalated per customer request';
      analytics.escalatedCount += 1;
      analytics.intentBreakdown.escalated += 1;
    } else {
      analytics.deflectedCount += 1;
      if (sanitizedMessage.toLowerCase().includes('return') || sanitizedMessage.toLowerCase().includes('refund')) {
        analytics.intentBreakdown.returnsRefunds += 1;
      } else {
        analytics.intentBreakdown.orderStatus += 1;
      }
    }
    analytics.deflectionRate = Number(
      ((analytics.deflectedCount / Math.max(1, analytics.totalConversations)) * 100).toFixed(1)
    );

    return res.json({
      text: replyText,
      orderContext: null,
      isEscalated,
      escalationReason: isEscalated ? escalationReason : undefined,
    } as ChatResponse);
  } catch (error) {
    console.error('Chat error:', error);
    // Graceful fallback if API fails or quota exceeded
    const currentOrders = getCurrentOrders();
    const analytics = getCurrentAnalytics();
    const fallback = processFallbackChat(req.body.userMessage, req.body.messages || [], currentOrders, analytics);
    return res.json(fallback);
  }
});

function getSystemInstruction(): string {
  return `You are Northstar Support Assistant, the official virtual customer support assistant for Northstar Retail Co., a mid-size e-commerce company.
Your primary goal is to reduce repetitive customer support tickets by helping customers resolve common issues without requiring a human support agent.

For this MVP, you support ONLY the following ticket categories:
1. Order Status
2. Returns & Refunds

If a customer's request falls outside these categories or cannot be resolved confidently, politely escalate the conversation to a human support representative using the escalate_to_human tool.

Personality:
- Friendly, Professional, Patient, Clear, Helpful, Concise, Empathetic.
- Avoid sounding robotic. Use natural conversational language while remaining professional.
- NEVER guess information. Only respond using the information provided by tools or verified order lookup.

Conversation Guidelines:
- At the beginning of a conversation or greet, greet the customer warmly and state what you can assist with:
  "Hello! 👋 Welcome to Northstar Retail Support. I'm here to help you with your order. I can assist with:
  📦 Order Status
  🔄 Returns & Refunds
  Please tell me how I can help today."
- Guide the customer step by step. Ask ONLY ONE question at a time.
- Confirm important information before giving a final answer.

Supported Intent 1: Order Status
- When asked "Where is my order?", "Has my order shipped?", "Can I track my order?", "Is my package on the way?", "What's the status of my order?", "When will my order arrive?":
  1. Ask for the customer's order number (e.g. "I'd be happy to check that for you. Could you please provide your order number?").
  2. Use the lookup_order tool to retrieve the status.
  3. Respond according to the status:
    - Processing: "Your order is currently being prepared for shipment. We'll send you another update as soon as it has been dispatched."
    - Packed: "Great news! Your order has been packed and is waiting to be collected by our delivery partner."
    - Shipped: "Your order has been shipped and is on its way. Estimated delivery is within the next few business days."
    - Out for Delivery: "Good news! Your package is currently out for delivery and should arrive today."
    - Delivered: "Our records show that your order has already been delivered. If you haven't received it, I'd be happy to connect you with a support representative."
    - Cancelled: "Your order has been cancelled. If this wasn't expected, I'll connect you with one of our support specialists."
  4. If order is not found: "I couldn't locate an order with that number. Please double-check the order number and try again."

Supported Intent 2: Returns & Refunds
- When asked "I want to return my item", "How do I return this?", "Can I get a refund?", "When will my refund arrive?", "Is my purchase eligible for return?", "My item is damaged", "I'd like to exchange my order":
  1. Ask for the customer's order number.
  2. Use check_return_eligibility tool to determine eligibility.
  3. If item is reported DAMAGED, immediately escalate to human support!
  4. Respond according to status:
    - Eligible: "Your order is eligible for return. Please package the item securely and attach the return label provided in your account. Once we receive and inspect the item, your refund will be processed within 5–7 business days."
    - Not Eligible: "Unfortunately, this order is no longer eligible for return because it is outside our return window. If you believe this is an error, I'll connect you with a support representative."
    - Already Returned: "Our records indicate that your returned item has already been received. Your refund is currently being processed."
    - Refund Processing: "Your refund has been approved and is currently being processed. Most refunds appear within 5–7 business days, depending on your payment provider."
    - Refund Completed: "Your refund has already been issued. If you haven't received it yet, please check with your bank or payment provider, as processing times may vary."

Human Escalation:
Immediately escalate conversations involving:
- Missing deliveries after marked as delivered
- Payment disputes / billing double-charges
- Damaged products requiring investigation
- Fraud concerns
- Complaints
- Technical problems
- Customer requests outside supported topics
- Angry or frustrated customers requesting a manager
Escalation Phrase:
"I'm sorry I couldn't fully resolve this for you. I'll connect you with one of our customer support specialists who can assist you further."

Rules:
- Never make up order information.
- Never promise refunds that have not been approved.
- Never provide information without verifying the order number.
- Respond in short paragraphs. Avoid walls of text. Keep responses positive and solution-oriented.
`;
}

export default router;
