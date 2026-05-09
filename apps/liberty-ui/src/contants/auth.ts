export const ACCESS_TOKEN_KEY = 'liberty_access_token';
export const REFRESH_TOKEN_KEY = 'liberty_refresh_token';
export const CURRENT_USER_KEY = 'liberty_current_user';
export const REFRESH_TOKEN_HEADER = 'x-refresh-token';

export const API_BASE_URL = process.env.UMI_APP_API_BASE_URL || '/api';

export const DEFAULT_PAGE_SIZE = 10;

export const ROLE_LABEL_MAP = {
  superAdmin: '超级管理员',
  admin: '管理员',
  user: '用户',
} as const;

export const STATUS_LABEL_MAP = {
  active: '启用',
  disabled: '禁用',
} as const;