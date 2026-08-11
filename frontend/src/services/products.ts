import type { Category, Paginated, Product } from '@/types';
import { apiGet } from './api';

export interface ProductQuery {
  category?: string;
  search?: string;
  collection?: string;
  page?: number;
  limit?: number;
}

export function getProducts(query: ProductQuery = {}) {
  const params = new URLSearchParams();
  if (query.category) params.set('category', query.category);
  if (query.search) params.set('search', query.search);
  if (query.collection) params.set('collection', query.collection);
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  const qs = params.toString();
  return apiGet<Paginated<Product>>(`/products${qs ? `?${qs}` : ''}`);
}

export function getProduct(id: string | number) {
  return apiGet<Product>(`/products/${id}`);
}

export function getCategories() {
  return apiGet<Category[]>('/categories');
}
