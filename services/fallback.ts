import { Order, DeflectionAnalytics } from '../src/types';
import { ChatResponse } from '../types/server';

export function processFallbackChat(
  userMsg: string,
  history: Array<{ sender: string; text: string }>,
  currentOrders: Order[],
  currentAnalytics: DeflectionAnalytics
): ChatResponse {
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
  const isReturnIntent = msg.includes('return') || msg.includes('refund') || msg.includes('exchange');
  if (isReturnIntent) {
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
      currentAnalytics.deflectedCount += 1;
      currentAnalytics.intentBreakdown.returnsRefunds += 1;
      return {
        text: "Your order is eligible for return.\n\nPlease package the item securely and attach the return label provided in your account.\n\nOnce we receive and inspect the item, your refund will be processed within 5–7 business days.",
        orderContext: order,
        isEscalated: false,
      };
    } else if (order.returnStatus === 'Not Eligible') {
      currentAnalytics.deflectedCount += 1;
      currentAnalytics.intentBreakdown.returnsRefunds += 1;
      return {
        text: "Unfortunately, this order is no longer eligible for return because it is outside our return window.\n\nIf you believe this is an error, I'll connect you with a support representative.",
        orderContext: order,
        isEscalated: false,
      };
    } else if (order.returnStatus === 'Already Returned') {
      currentAnalytics.deflectedCount += 1;
      currentAnalytics.intentBreakdown.returnsRefunds += 1;
      return {
        text: "Our records indicate that your returned item has already been received.\n\nYour refund is currently being processed.",
        orderContext: order,
        isEscalated: false,
      };
    } else if (order.returnStatus === 'Refund Processing') {
      currentAnalytics.deflectedCount += 1;
      currentAnalytics.intentBreakdown.returnsRefunds += 1;
      return {
        text: "Your refund has been approved and is currently being processed.\n\nMost refunds appear within 5–7 business days, depending on your payment provider.",
        orderContext: order,
        isEscalated: false,
      };
    } else if (order.returnStatus === 'Refund Completed') {
      currentAnalytics.deflectedCount += 1;
      currentAnalytics.intentBreakdown.returnsRefunds += 1;
      return {
        text: "Your refund has already been issued.\n\nIf you haven't received it yet, please check with your bank or payment provider, as processing times may vary.",
        orderContext: order,
        isEscalated: false,
      };
    }
  }

  // Order Status intent
  const isOrderStatusIntent = msg.includes('where') || msg.includes('status') || msg.includes('track') || msg.includes('ship') || msg.includes('arrive') || msg.includes('order') || foundOrderNum;
  if (isOrderStatusIntent) {
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

    currentAnalytics.deflectedCount += 1;
    currentAnalytics.intentBreakdown.orderStatus += 1;
    currentAnalytics.deflectionRate = Number(
      ((currentAnalytics.deflectedCount / Math.max(1, currentAnalytics.totalConversations)) * 100).toFixed(1)
    );

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
