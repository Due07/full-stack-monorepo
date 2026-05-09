import type {
  AdminAuditLogItem,
  AdminUserDetail,
  AdminUserItem,
  CreateAdminUserPayload,
  OperationStatus,
  PagedQuery,
  PagedResult,
  SessionItem,
  UserStatus,
} from '@/types/api';
import { DEFAULT_PAGE_SIZE } from '@contants/auth';
import { request } from './request';

function buildPaginationQuery(query?: PagedQuery) {
  const search = new URLSearchParams({
    page: String(query?.page ?? 1),
    pageSize: String(query?.pageSize ?? DEFAULT_PAGE_SIZE),
  });

  return `?${search.toString()}`;
}

export function getAdminUsers(query?: PagedQuery) {
  return request<PagedResult<AdminUserItem>>(`/admin/users${buildPaginationQuery(query)}`, { method: 'GET' });
}

export function createAdminUser(data: CreateAdminUserPayload) {
  return request<AdminUserDetail>('/admin/users', {
    method: 'POST',
    body: data,
  });
}

export function getAdminUserDetail(id: string) {
  return request<AdminUserDetail>(`/admin/users/${id}`, { method: 'GET' });
}

export function updateAdminUserStatus(id: string, data: { status: UserStatus; reason?: string }) {
  return request<AdminUserDetail>(`/admin/users/${id}/status`, {
    method: 'PATCH',
    body: data,
  });
}

export function forceLogoutUser(id: string, sessionId: string) {
  return request<OperationStatus>(`/admin/users/${id}/force-logout`, {
    method: 'POST',
    body: { sessionId },
  });
}

export function forceLogoutAllUserSessions(id: string) {
  return request<OperationStatus>(`/admin/users/${id}/force-logout-all`, {
    method: 'POST',
    body: {},
  });
}

export function unfreezeLoginAccount(data: { account: string; reason?: string }) {
  return request<OperationStatus>('/admin/users/unfreeze-login', {
    method: 'POST',
    body: data,
  });
}

export function getAdminUserSessions(id: string) {
  return request<{ items: SessionItem[] }>(`/admin/users/${id}/sessions`, { method: 'GET' });
}

export function getAdminUserLoginHistory(id: string, query?: PagedQuery) {
  return request<PagedResult<AdminAuditLogItem>>(`/admin/users/${id}/login-history${buildPaginationQuery(query)}`, {
    method: 'GET',
  });
}

export function getAuditLogs(query?: PagedQuery) {
  return request<PagedResult<AdminAuditLogItem>>(`/admin/users/audit-logs/list${buildPaginationQuery(query)}`, {
    method: 'GET',
  });
}
