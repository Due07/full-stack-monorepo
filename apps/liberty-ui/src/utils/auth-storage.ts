import { ACCESS_TOKEN_KEY, CURRENT_USER_KEY, REFRESH_TOKEN_KEY } from '@contants';
import type { AuthUser } from '@/types/api';

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(CURRENT_USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuthStorage(payload: {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}) {
  localStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(payload.user));
}

export function clearAuthStorage() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
}
