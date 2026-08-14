import { Router, Response } from 'express';
import { setCurrentOrders } from './orders';
import { resetAnalytics } from './analytics';
import { INITIAL_ORDERS } from '../src/mockData';

const router = Router();

router.post('/', (_req, res: Response) => {
  setCurrentOrders([...INITIAL_ORDERS]);
  resetAnalytics();
  res.json({ status: 'ok', message: 'Demo data reset successfully' });
});

export default router;
