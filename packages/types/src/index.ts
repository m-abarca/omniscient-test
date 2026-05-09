export type OrderStatus =
  | 'planned'
  | 'scheduled'
  | 'in_progress'
  | 'completed';

export const ORDER_STATUSES: readonly OrderStatus[] = [
  'planned',
  'scheduled',
  'in_progress',
  'completed',
] as const;

export interface ProductionOrder {
  id: string;
  reference: string;
  product: string;
  quantity: number;
  startDate: string;
  endDate: string;
  status: OrderStatus;
  createdAt: string;
}

export interface CreateOrderInput {
  reference: string;
  product: string;
  quantity: number;
  startDate: string;
  endDate: string;
  status?: OrderStatus;
}

export interface RescheduleResult {
  updated: ProductionOrder[];
  total: number;
}
