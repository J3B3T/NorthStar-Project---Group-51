import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { INITIAL_ORDERS, INITIAL_ANALYTICS } from './src/mockData';
import { Order, DeflectionAnalytics, EscalationTicket } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory data store for live state during session
let currentOrders: Order[] = [...INITIAL_ORDERS];
let currentAnalytics: DeflectionAnalytics = JSON.parse(JSON.stringify(INITIAL_ANALYTICS));

// System Instruction for Northstar Support Assistant
const NORTHSTAR_SYSTEM_INSTRUCTION = `
You are Northstar Support Assistant, the official virtual customer support assistant for Northstar Retail Co., a mid-size e-commerce company.
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

// Initialize Gemini Client
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Tool Definitions for Gemini
const lookupOrderTool = {
  name: 'lookup_order',
  description: 'Lookup real-time order details and delivery status for a Northstar Retail order number.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      orderNumber: {
        type: Type.STRING,
        description: 'The order number provided by the customer, e.g. NS1001, NS1004',
      },
    },
    required: ['orderNumber'],
  },
};

const checkReturnEligibilityTool = {
  name: 'check_return_eligibility',
  description: 'Check return window, eligibility, refund status or damaged status for a Northstar order number.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      orderNumber: {
        type: Type.STRING,
        description: 'The order number provided by the customer',
      },
      isDamagedReported: {
        type: Type.BOOLEAN,
        description: 'Set to true if the customer stated the product arrived damaged',
      },
    },
    required: ['orderNumber'],
  },
};

const escalateToHumanTool = {
  name: 'escalate_to_human',
  description: 'Escalate the ticket to a human support agent when outside scope, damaged item, or customer requests a representative/manager.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      reason: {
        type: Type.STRING,
        description: 'Reason for human escalation (e.g. Damaged item, Payment dispute, Out of scope request, Manager requested)',
      },
      orderNumber: {
        type: Type.STRING,
        description: 'Associated order number if available',
      },
    },
    required: ['reason'],
  },
};

// API Endpoint: Get Orders List
app.get('/api/orders', (req, res) => {
  res.json({ orders: currentOrders });
});

// API Endpoint: Get Single Order
app.get('/api/orders/:orderNumber', (req, res) => {
  const orderNum = req.params.orderNumber.toUpperCase();
  const order = currentOrders.find((o) => o.orderNumber === orderNum);
  if (order) {
    res.json({ order });
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

// API Endpoint: Get Analytics
app.get('/api/analytics', (req, res) => {
  res.json({ analytics: currentAnalytics });
});

// API Endpoint: Reset Mock Data
app.post('/api/reset', (req, res) => {
  currentOrders = [...INITIAL_ORDERS];
  currentAnalytics = JSON.parse(JSON.stringify(INITIAL_ANALYTICS));
  res.json({ status: 'ok', message: 'Demo data reset successfully' });
});

// Helper tool handlers
function executeToolCall(name: string, args: any): { result: any; orderContext?: Order | null; isEscalated?: boolean; escalationReason?: string } {
  const orderNum = args?.orderNumber ? String(args.orderNumber).trim().toUpperCase() : '';

  if (name === 'lookup_order') {
    const order = currentOrders.find((o) => o.orderNumber === orderNum);
    if (order) {
      return {
        result: {
          found: true,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          status: order.status,
          statusMessage: order.statusMessage,
          trackingNumber: order.trackingNumber,
          carrier: order.carrier,
          estimatedDelivery: order.estimatedDelivery,
          total: order.total,
          items: order.items,
        },
        orderContext: order,
      };
    } else {
      return {
        result: {
          found: false,
          orderNumber: orderNum,
          message: 'Order not found in database',
        },
        orderContext: null,
      };
    }
  }

  if (name === 'check_return_eligibility') {
    const order = currentOrders.find((o) => o.orderNumber === orderNum);
    if (!order) {
      return {
        result: {
          found: false,
          orderNumber: orderNum,
          message: 'Order not found in database',
        },
        orderContext: null,
      };
    }

    if (args.isDamagedReported || order.isDamagedReported) {
      return {
        result: {
          found: true,
          orderNumber: order.orderNumber,
          requiresEscalation: true,
          escalationReason: 'Damaged item requiring investigation',
          message: 'Damaged items require human agent review.',
        },
        orderContext: order,
        isEscalated: true,
        escalationReason: 'Damaged product reported',
      };
    }

    return {
      result: {
        found: true,
        orderNumber: order.orderNumber,
        returnStatus: order.returnStatus,
        returnReason: order.returnReason,
        refundAmount: order.refundAmount,
        returnWindowDays: order.returnWindowDays,
      },
      orderContext: order,
    };
  }

  if (name === 'escalate_to_human') {
    const reason = args.reason || 'Requested human support representative';
    return {
      result: {
        escalated: true,
        reason,
        orderNumber: orderNum || undefined,
        message: "Connecting customer to a human support specialist.",
      },
      isEscalated: true,
      escalationReason: reason,
    };
  }

  return { result: { error: 'Unknown tool call' } };
}

// API Endpoint: Chat Completion
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, userMessage } = req.body;
    const ai = getGenAI();

    // Track analytics count
    currentAnalytics.totalConversations += 1;

    if (!ai) {
      // Fallback deterministic logic if GEMINI_API_KEY is not set or unavailable
      const fallbackResponse = processFallbackChat(userMessage, messages || []);
      return res.json(fallbackResponse);
    }

    // Format conversation history for Gemini
    const contents: any[] = [];
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
    contents.push({ role: 'user', parts: [{ text: userMessage }] });

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config: {
        systemInstruction: NORTHSTAR_SYSTEM_INSTRUCTION,
        temperature: 0.2,
        tools: [{ functionDeclarations: [lookupOrderTool, checkReturnEligibilityTool, escalateToHumanTool] }],
      },
    });

    // Check if Gemini invoked any tool calls
    const functionCalls = response.functionCalls;
    let finalOrderContext: Order | null = null;
    let isEscalated = false;
    let escalationReason = '';

    if (functionCalls && functionCalls.length > 0) {
      // Execute the function call and send tool result back for a final response
      const toolCall = functionCalls[0];
      const toolExec = executeToolCall(toolCall.name, toolCall.args);

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

      const secondResponse = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: toolContent,
        config: {
          systemInstruction: NORTHSTAR_SYSTEM_INSTRUCTION,
          temperature: 0.2,
        },
      });

      const replyText = secondResponse.text || "I'm here to help with your order status or return.";

      // Update analytics
      if (isEscalated) {
        currentAnalytics.escalatedCount += 1;
        currentAnalytics.intentBreakdown.escalated += 1;
        // Log ticket
        const ticketId = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
        currentAnalytics.recentTickets.unshift({
          ticketId,
          orderNumber: finalOrderContext?.orderNumber,
          customerName: finalOrderContext?.customerName || 'Customer',
          reason: escalationReason,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          status: 'Pending',
          conversationSnippet: [
            `Customer: ${userMessage}`,
            `Assistant: ${replyText}`,
          ],
        });
      } else {
        currentAnalytics.deflectedCount += 1;
        if (userMessage.toLowerCase().includes('return') || userMessage.toLowerCase().includes('refund')) {
          currentAnalytics.intentBreakdown.returnsRefunds += 1;
        } else {
          currentAnalytics.intentBreakdown.orderStatus += 1;
        }
      }
      currentAnalytics.deflectionRate = Number(
        ((currentAnalytics.deflectedCount / Math.max(1, currentAnalytics.totalConversations)) * 100).toFixed(1)
      );

      return res.json({
        text: replyText,
        orderContext: finalOrderContext,
        isEscalated,
        escalationReason: isEscalated ? escalationReason : undefined,
      });
    }

    const replyText = response.text || "Hello! 👋 Welcome to Northstar Retail Support. How can I help you today?";

    // Check if reply text indicates escalation
    if (replyText.toLowerCase().includes('connect you with') || replyText.toLowerCase().includes('support specialist')) {
      isEscalated = true;
      escalationReason = 'Escalated per customer request';
      currentAnalytics.escalatedCount += 1;
      currentAnalytics.intentBreakdown.escalated += 1;
    } else {
      currentAnalytics.deflectedCount += 1;
      currentAnalytics.intentBreakdown.orderStatus += 1;
    }
    currentAnalytics.deflectionRate = Number(
      ((currentAnalytics.deflectedCount / Math.max(1, currentAnalytics.totalConversations)) * 100).toFixed(1)
    );

    return res.json({
      text: replyText,
      orderContext: null,
      isEscalated,
      escalationReason: isEscalated ? escalationReason : undefined,
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    // Graceful fallback if API fails or quota exceeded
    const fallback = processFallbackChat(req.body.userMessage, req.body.messages);
    return res.json(fallback);
  }
});

// Deterministic fallback chat logic ensuring 100% reliable evaluation & offline support
function processFallbackChat(userMsg: string, history: any[]): { text: string; orderContext: Order | null; isEscalated: boolean; escalationReason?: string } {
  const msg = userMsg.trim().toLowerCase();

  // Extract order number if present (e.g. NS1001 to NS1010)
  const orderMatch = userMsg.match(/NS\d{4}/i);
  const foundOrderNum = orderMatch ? orderMatch[0].toUpperCase() : null;
  const order = foundOrderNum ? currentOrders.find((o) => o.orderNumber === foundOrderNum) : null;

  // Check Escalation triggers
  const isEscalationTrigger =
    msg.includes('damaged') ||
    msg.includes('broken') ||
    msg.includes('double charge') ||
    msg.includes('fraud') ||
    msg.includes('manager') ||
    msg.includes('agent') ||
    msg.includes('human') ||
    msg.includes('stolen') ||
    msg.includes('never received') ||
    msg.includes('complaint');

  if (isEscalationTrigger) {
    let reason = 'Specialist investigation required';
    if (msg.includes('damaged') || msg.includes('broken')) reason = 'Damaged product reported';
    else if (msg.includes('manager') || msg.includes('human') || msg.includes('agent')) reason = 'Customer requested human representative';
    else if (msg.includes('double charge') || msg.includes('fraud')) reason = 'Billing discrepancy or fraud concern';

    currentAnalytics.escalatedCount += 1;
    currentAnalytics.intentBreakdown.escalated += 1;

    return {
      text: "I'm sorry I couldn't fully resolve this for you. I'll connect you with one of our customer support specialists who can assist you further.",
      orderContext: order || null,
      isEscalated: true,
      escalationReason: reason,
    };
  }

  // Returns & Refunds intent
  if (msg.includes('return') || msg.includes('refund') || msg.includes('exchange')) {
    if (!foundOrderNum) {
      return {
        text: "Certainly. Could you please provide your order number so I can check your return eligibility?",
        orderContext: null,
        isEscalated: false,
      };
    }

    if (!order) {
      return {
        text: "I couldn't locate an order with that number. Please double-check the order number and try again.",
        orderContext: null,
        isEscalated: false,
      };
    }

    if (order.returnStatus === 'Eligible') {
      return {
        text: "Your order is eligible for return.\n\nPlease package the item securely and attach the return label provided in your account.\n\nOnce we receive and inspect the item, your refund will be processed within 5–7 business days.",
        orderContext: order,
        isEscalated: false,
      };
    } else if (order.returnStatus === 'Not Eligible') {
      return {
        text: "Unfortunately, this order is no longer eligible for return because it is outside our return window.\n\nIf you believe this is an error, I'll connect you with a support representative.",
        orderContext: order,
        isEscalated: false,
      };
    } else if (order.returnStatus === 'Already Returned') {
      return {
        text: "Our records indicate that your returned item has already been received.\n\nYour refund is currently being processed.",
        orderContext: order,
        isEscalated: false,
      };
    } else if (order.returnStatus === 'Refund Processing') {
      return {
        text: "Your refund has been approved and is currently being processed.\n\nMost refunds appear within 5–7 business days, depending on your payment provider.",
        orderContext: order,
        isEscalated: false,
      };
    } else if (order.returnStatus === 'Refund Completed') {
      return {
        text: "Your refund has already been issued.\n\nIf you haven't received it yet, please check with your bank or payment provider, as processing times may vary.",
        orderContext: order,
        isEscalated: false,
      };
    }
  }

  // Order Status intent
  if (msg.includes('where') || msg.includes('status') || msg.includes('track') || msg.includes('ship') || msg.includes('arrive') || msg.includes('order') || foundOrderNum) {
    if (!foundOrderNum) {
      return {
        text: "I'd be happy to check that for you. Could you please provide your order number?",
        orderContext: null,
        isEscalated: false,
      };
    }

    if (!order) {
      return {
        text: "I couldn't locate an order with that number. Please double-check the order number and try again.",
        orderContext: null,
        isEscalated: false,
      };
    }

    let statusReply = '';
    switch (order.status) {
      case 'Processing':
        statusReply = "Your order is currently being prepared for shipment. We'll send you another update as soon as it has been dispatched.";
        break;
      case 'Packed':
        statusReply = "Great news! Your order has been packed and is waiting to be collected by our delivery partner.";
        break;
      case 'Shipped':
        statusReply = `Your order has been shipped and is on its way. Estimated delivery is ${order.estimatedDelivery || 'within the next few business days'}.`;
        break;
      case 'Out for Delivery':
        statusReply = "Good news! Your package is currently out for delivery and should arrive today.";
        break;
      case 'Delivered':
        statusReply = "Our records show that your order has already been delivered. If you haven't received it, I'd be happy to connect you with a support representative.";
        break;
      case 'Cancelled':
        statusReply = "Your order has been cancelled. If this wasn't expected, I'll connect you with one of our support specialists.";
        break;
    }

    return {
      text: statusReply,
      orderContext: order,
      isEscalated: false,
    };
  }

  // Default Greeting
  return {
    text: "Hello! 👋 Welcome to Northstar Retail Support. I'm here to help you with your order. I can assist with:\n\n📦 Order Status\n\n🔄 Returns & Refunds\n\nPlease tell me how I can help today.",
    orderContext: null,
    isEscalated: false,
  };
}

// Start Server
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Northstar Support Applet server running at http://0.0.0.0:${PORT}`);
  });
}

start();
