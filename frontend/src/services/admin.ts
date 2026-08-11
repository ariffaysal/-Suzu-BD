import type {
  Category,
  CreateCategoryInput,
  CreateProductInput,
  Order,
  OrderStatsPeriod,
  Paginated,
  Product,
  UploadResponse,
} from '@/types';
import { clearStoredToken, getStoredToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

/**
 * Authenticated fetch for admin routes. Attaches the stored JWT, and drops it
 * when the API reports the token is missing/expired (401).
 */
async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (res.status === 401) {
    clearStoredToken();
  }

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const data = (await res.json()) as {
        message?: string | string[];
        error?: string;
        statusCode?: number;
      };
      if (typeof data.message === 'string') message = data.message;
      else if (Array.isArray(data.message)) message = data.message.join(', ');
      else if (data.error) message = `${data.error} (${data.statusCode ?? res.status})`;
    } catch {
      // ignore JSON parse failures
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}

// ---------- Products ----------

/**
 * Fetches the public (paginated) product list. The admin views load the whole
 * catalog for client-side search/filtering, so they request the server's max
 * page size.
 */
export function adminGetProducts(params: { page?: number; limit?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  const query = qs.toString();
  return adminFetch<Paginated<Product>>(`/products${query ? `?${query}` : ''}`);
}

export function adminGetProduct(id: number) {
  return adminFetch<Product>(`/products/${id}`);
}

export function createProduct(input: CreateProductInput) {
  return adminFetch<Product>('/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function updateProduct(id: number, input: CreateProductInput) {
  return adminFetch<Product>(`/products/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function deleteProduct(id: number) {
  return adminFetch<{ deleted: boolean; id: number }>(`/products/${id}`, {
    method: 'DELETE',
  });
}

// ---------- Categories ----------

export function adminGetCategories() {
  return adminFetch<Category[]>('/categories');
}

export function createCategory(input: CreateCategoryInput) {
  return adminFetch<Category>('/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function deleteCategory(id: number) {
  return adminFetch<{ deleted: boolean; id: number }>(`/categories/${id}`, {
    method: 'DELETE',
  });
}

// ---------- Orders ----------

export function getOrders(params: { page?: number; limit?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  const query = qs.toString();
  return adminFetch<Paginated<Order>>(`/orders${query ? `?${query}` : ''}`);
}

export function getOrderStats() {
  return adminFetch<OrderStatsPeriod[]>('/orders/stats');
}

export function updateOrderStatus(id: number, status: string) {
  return adminFetch<Order>(`/orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

export function deleteOrder(id: number) {
  return adminFetch<{ deleted: boolean; id: number }>(`/orders/${id}`, {
    method: 'DELETE',
  });
}

// ---------- Image upload ----------

export function uploadImage(file: File) {
  const body = new FormData();
  body.append('file', file);
  return adminFetch<UploadResponse>('/uploads', {
    method: 'POST',
    body,
  });
}
