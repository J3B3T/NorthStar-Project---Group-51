import { Router, Response } from 'express';
import { INITIAL_ANALYTICS } from '../src/mockData';
import { DeflectionAnalytics } from '../src/types';

const router = Router();

let currentAnalytics: DeflectionAnalytics = JSON.parse(JSON.stringify(INITIAL_ANALYTICS));

export function getCurrentAnalytics(): DeflectionAnalytics {
  return currentAnalytics;
}

export function setCurrentAnalytics(analytics: DeflectionAnalytics): void {
  currentAnalytics = analytics;
}

router.get('/', (_req, res: Response) => {
  res.json({ analytics: currentAnalytics });
});

export function resetAnalytics(): void {
  currentAnalytics = JSON.parse(JSON.stringify(INITIAL_ANALYTICS));
}

export default router;
