import type { OperationStatus, SessionItem } from '@/types/api';
import { request } from './request';

export function getCurrentSessions() {
  return request<{ items: SessionItem[] }>('/admin/sessions', { method: 'GET' });
}

export function revokeCurrentSession(sessionId: string) {
  return request<OperationStatus>(`/admin/sessions/${sessionId}`, { method: 'DELETE' });
}

export function logoutAllSessions() {
  return request<OperationStatus>('/admin/sessions/logout-all', { method: 'POST', body: {} });
}
