import type { SystemSettingItem, SystemSettingListData } from '@/types/api';
import { request } from './request';

export function getSystemSettings() {
  return request<SystemSettingListData>('/admin/system-settings', { method: 'GET' });
}

export function updateSystemSetting(key: string, value: boolean | string) {
  return request<SystemSettingItem>(`/admin/system-settings/${key}`, {
    method: 'PATCH',
    body: { value },
  });
}
