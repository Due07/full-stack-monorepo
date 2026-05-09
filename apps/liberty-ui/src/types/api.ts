export type UserRole = 'user' | 'admin' | 'superAdmin';
export type UserStatus = 'active' | 'disabled';

export type ApiResponse<T> = {
  code: number;
  msg: string;
  data: T;
};

export type ApiErrorShape = {
  code: number;
  msg: string;
  data: unknown;
  status?: number;
};

export type AuthUser = {
  id: string;
  username: string;
  displayName: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  user: AuthUser;
};

export type SessionItem = {
  sessionId: string;
  deviceType: string | null;
  deviceName: string | null;
  clientIp: string | null;
  userAgent: string | null;
  lastActiveAt: string | null;
  expiresAt: string;
  isRevoked: boolean;
};

export type OperationStatus = {
  status: 'ok';
};

export type PagedQuery = {
  page?: number;
  pageSize?: number;
};

export type AdminUserItem = {
  id: string;
  username: string;
  displayName: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
};

export type AdminUserDetail = AdminUserItem & {
  lastLoginAt: string | null;
};

export type CreateAdminUserPayload = {
  username: string;
  displayName?: string;
  phone?: string;
  password: string;
  role?: 'user' | 'admin';
};

export type PagedResult<T> = {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
};

export type AdminAuditLogItem = {
  id: string;
  action: string;
  userId: string | null;
  username: string | null;
  operatorUserId: string | null;
  operatorUsername: string | null;
  metadata: unknown;
  createdAt: string;
};

export type SystemSettingItem = {
  key: string;
  value: string;
  description: string | null;
  updatedAt: string;
};

export type SystemSettingListData = {
  items: SystemSettingItem[];
};

export class ApiError extends Error {
  code: number;
  data: unknown;
  status?: number;

  constructor(payload: ApiErrorShape) {
    super(payload.msg);
    this.name = 'ApiError';
    this.code = payload.code;
    this.data = payload.data;
    this.status = payload.status;
  }
}
