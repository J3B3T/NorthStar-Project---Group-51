import { GoogleGenAI, Type } from '@google/genai';
import { Order } from '../src/types';
import { ToolExecutionResult } from '../types/server';

const TIMEOUT_MS = 30_000;

export function getGenAI() {
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
}

export const lookupOrderTool = {
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

export const checkReturnEligibilityTool = {
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

export const escalateToHumanTool = {
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

export async function executeToolCall(
  name: string,
  args: Record<string, unknown>,
  currentOrders: Order[]
): Promise<ToolExecutionResult> {
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
    const reason = String(args.reason || 'Requested human support representative');
    return {
      result: {
        escalated: true,
        reason,
        orderNumber: orderNum || undefined,
        message: 'Connecting customer to a human support specialist.',
      },
      isEscalated: true,
      escalationReason: reason,
    };
  }

  return { result: { error: 'Unknown tool call' } };
}

export function withTimeout<T>(promise: Promise<T>, ms: number = TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
    ),
  ]);
}
