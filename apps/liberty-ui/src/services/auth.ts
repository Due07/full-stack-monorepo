import type { AuthTokens, AuthUser, OperationStatus } from '@/types/api';
import { request } from './request';

export function login(data: { account: string; password: string }) {
  return request<AuthTokens>('/admin/auth/login', {
    method: 'POST',
    body: data,
    skipAuth: true,
    skipRefresh: true,
  });
}

export function getCurrentUser() {
  return request<AuthUser>('/admin/auth/me', { method: 'GET' });
}

export function logout(sessionId?: string) {
  return request<OperationStatus>('/admin/auth/logout', {
    method: 'POST',
    body: sessionId ? { sessionId } : {},
  });
}
