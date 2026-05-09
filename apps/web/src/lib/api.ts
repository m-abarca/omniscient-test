import type {
  CreateOrderInput,
  ProductionOrder,
  RescheduleResult,
} from '@omniscient/types';

const baseUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3001';

class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = (await res.json()) as { message?: string | string[] };
      const m = data?.message;
      if (typeof m === 'string') detail = m;
      else if (Array.isArray(m)) detail = m.join(', ');
    } catch {
      // ignorar
    }
    throw new ApiError(res.status, `${res.status} ${detail}`);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  listOrders: () => request<ProductionOrder[]>('GET', '/orders'),
  createOrder: (input: CreateOrderInput) =>
    request<ProductionOrder>('POST', '/orders', input),
  reschedule: () => request<RescheduleResult>('POST', '/orders/reschedule'),
};

export { ApiError };
