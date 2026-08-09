import type { CreateOrderInput, Order } from '@/types';
import { apiPost } from './api';

export function createOrder(input: CreateOrderInput) {
  return apiPost<Order>('/orders', input);
}
