import { Request, Response, NextFunction } from 'express';
import { ChatRequestBody } from '../types/server';

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_LENGTH = 50;

export function validateChatBody(req: Request, res: Response, next: NextFunction): void {
  const body = req.body as Partial<ChatRequestBody>;

  if (!body.userMessage || typeof body.userMessage !== 'string') {
    res.status(400).json({ error: 'userMessage is required and must be a string' });
    return;
  }

  const trimmed = body.userMessage.trim();
  if (trimmed.length === 0) {
    res.status(400).json({ error: 'userMessage cannot be empty' });
    return;
  }

  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    res.status(400).json({ error: `userMessage exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters` });
    return;
  }

  if (body.messages && !Array.isArray(body.messages)) {
    res.status(400).json({ error: 'messages must be an array' });
    return;
  }

  if (Array.isArray(body.messages) && body.messages.length > MAX_HISTORY_LENGTH) {
    res.status(400).json({ error: `messages history exceeds maximum length of ${MAX_HISTORY_LENGTH}` });
    return;
  }

  next();
}

export function sanitizeString(str: string): string {
  return str
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}
