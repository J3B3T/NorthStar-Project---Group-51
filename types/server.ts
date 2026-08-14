import { Order, DeflectionAnalytics, EscalationTicket } from '../src/types';

export interface ChatRequestBody {
  userMessage: string;
  messages: Array<{
    sender: 'user' | 'assistant';
    text: string;
  }>;
}

export interface ChatResponse {
  text: string;
  orderContext: Order | null;
  isEscalated: boolean;
  escalationReason?: string;
}

export interface ToolExecutionResult {
  result: Record<string, unknown>;
  orderContext?: Order | null;
  isEscalated?: boolean;
  escalationReason?: string;
}

export interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}
