export type OrderStatus =
  | 'Processing'
  | 'Packed'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export type ReturnEligibility =
  | 'Eligible'
  | 'Not Eligible'
  | 'Already Returned'
  | 'Refund Processing'
  | 'Refund Completed';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  orderNumber: string;
  customerName: string;
  email: string;
  orderDate: string;
  status: OrderStatus;
  statusMessage: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  shippingAddress: string;
  total: number;
  items: OrderItem[];
  returnStatus: ReturnEligibility;
  returnReason?: string;
  refundAmount?: number;
  returnWindowDays: number;
  isDamagedReported?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  orderContext?: Order | null;
  isEscalated?: boolean;
  escalationReason?: string;
  suggestedActions?: string[];
  feedbackGiven?: 'helpful' | 'not_helpful';
}

export interface EscalationTicket {
  ticketId: string;
  orderNumber?: string;
  customerName: string;
  reason: string;
  timestamp: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  conversationSnippet: string[];
}

export interface DeflectionAnalytics {
  totalConversations: number;
  deflectedCount: number;
  escalatedCount: number;
  deflectionRate: number;
  intentBreakdown: {
    orderStatus: number;
    returnsRefunds: number;
    escalated: number;
  };
  recentTickets: EscalationTicket[];
}
