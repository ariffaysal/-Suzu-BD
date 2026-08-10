import type { Admin } from '@/types';
import { apiFetch, apiPost } from './api';

const TOKEN_KEY = 'footwear-admin-token';

export interface LoginResponse {
  accessToken: string;
}

/** Token is only ever read/written in the browser (localStorage). */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function storeToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore quota errors
  }
}

export function clearStoredToken(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

/** Admin-only login. Returns a JWT access token to store on the client. */
export function loginAdmin(email: string, password: string) {
  return apiPost<LoginResponse>('/auth/login', { email, password });
}

/** Validates the stored token with the server and returns the admin payload. */
export function getMe(token: string) {
  return apiFetch<Admin>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}
