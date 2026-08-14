import { describe, it, expect } from 'vitest';
import { processFallbackChat } from '../../services/fallback';
import { Order, DeflectionAnalytics } from '../types';
import { INITIAL_ORDERS, INITIAL_ANALYTICS } from '../mockData';

describe('processFallbackChat', () => {
  const createAnalytics = (): DeflectionAnalytics => JSON.parse(JSON.stringify(INITIAL_ANALYTICS));
  const orders = [...INITIAL_ORDERS];

  it('returns greeting for unknown message', () => {
    const analytics = createAnalytics();
    const result = processFallbackChat('hello', [], orders, analytics);
    expect(result.text).toContain('Welcome to Northstar Retail Support');
    expect(result.isEscalated).toBe(false);
  });

  it('handles order status query with order number', () => {
    const analytics = createAnalytics();
    const result = processFallbackChat('Where is my order NS1001?', [], orders, analytics);
    expect(result.text).toContain('prepared for shipment');
    expect(result.orderContext?.orderNumber).toBe('NS1001');
    expect(analytics.deflectedCount).toBe(1);
    expect(analytics.intentBreakdown.orderStatus).toBe(1);
  });

  it('handles return eligibility query', () => {
    const analytics = createAnalytics();
    const result = processFallbackChat('I want to return order NS1005', [], orders, analytics);
    expect(result.text).toContain('eligible for return');
    expect(analytics.deflectedCount).toBe(1);
    expect(analytics.intentBreakdown.returnsRefunds).toBe(1);
  });

  it('escalates damaged item reports', () => {
    const analytics = createAnalytics();
    const result = processFallbackChat('My order NS1007 arrived damaged', [], orders, analytics);
    expect(result.isEscalated).toBe(true);
    expect(result.escalationReason).toBe('Damaged product reported');
    expect(analytics.escalatedCount).toBe(1);
  });

  it('escalates manager requests', () => {
    const analytics = createAnalytics();
    const result = processFallbackChat('I want to speak to a manager', [], orders, analytics);
    expect(result.isEscalated).toBe(true);
    expect(result.escalationReason).toBe('Customer requested human representative');
  });
});
