import { Request, Response, NextFunction } from 'express';
import { RateLimitStore } from '../types/server';

const store: RateLimitStore = {};
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 20;

export function rateLimit(_req: Request, res: Response, next: NextFunction): void {
  const key = _req.ip || 'unknown';
  const now = Date.now();

  if (!store[key] || now > store[key].resetTime) {
    store[key] = { count: 0, resetTime: now + WINDOW_MS };
  }

  store[key].count += 1;

  if (store[key].count > MAX_REQUESTS) {
    res.set('Retry-After', Math.ceil((store[key].resetTime - now) / 1000).toString());
    res.status(429).json({ error: 'Too many requests. Please try again later.' });
    return;
  }

  res.set('X-RateLimit-Limit', MAX_REQUESTS.toString());
  res.set('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - store[key].count).toString());
  next();
}
