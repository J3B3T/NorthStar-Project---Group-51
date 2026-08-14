import { Router, Response } from 'express';
import { INITIAL_ORDERS } from '../src/mockData';
import { Order } from '../src/types';

const router = Router();

let currentOrders: Order[] = [...INITIAL_ORDERS];

export function getCurrentOrders(): Order[] {
  return currentOrders;
}

export function setCurrentOrders(orders: Order[]): void {
  currentOrders = orders;
}

router.get('/', (_req, res: Response) => {
  res.json({ orders: currentOrders });
});

router.get('/:orderNumber', (req, res: Response) => {
  const orderNum = req.params.orderNumber.toUpperCase();
  const order = currentOrders.find((o) => o.orderNumber === orderNum);
  if (order) {
    res.json({ order });
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

export default router;
