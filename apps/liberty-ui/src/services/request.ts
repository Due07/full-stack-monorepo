import { history } from 'umi';
import { API_BASE_URL, REFRESH_TOKEN_HEADER } from '@contants';
import { useAuthStore } from '@/stores/auth';
import { ApiError, type ApiResponse, type AuthTokens } from '@/types/api';
import { getAccessToken, getRefreshToken } from '@/utils/auth-storage';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  skipAuth?: boolean;
  skipRefresh?: boolean;
  retry?: boolean;
};

let refreshPromise: Promise<void> | null = null;

function buildUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!payload) {
    throw new ApiError({
      code: response.status || 500,
      msg: '服务返回格式不正确',
      data: null,
      status: response.status,
    });
  }

  if (!response.ok || payload.code !== 200) {
    throw new ApiError({
      code: payload.code || response.status || 500,
      msg: payload.msg || '请求失败',
      data: payload.data,
      status: response.status,
    });
  }

  return payload;
}

function logoutAndRedirect() {
  useAuthStore.getState().clearSession();

  if (history.location.pathname !== '/login') {
    history.push(`/login?redirect=${encodeURIComponent(history.location.pathname + history.location.search)}`);
  }
}

async function refreshTokens() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new ApiError({ code: 401, msg: '登录已失效，请重新登录', data: null, status: 401 });
  }

  const response = await fetch(buildUrl('/admin/auth/refresh'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      [REFRESH_TOKEN_HEADER]: refreshToken,
    },
    body: JSON.stringify({ refreshToken }),
  });

  const payload = await parseResponse<AuthTokens>(response);

  useAuthStore.getState().setSession({
    accessToken: payload.data.accessToken,
    refreshToken: payload.data.refreshToken,
    user: payload.data.user,
  });
}

async function ensureRefreshed() {
  if (!refreshPromise) {
    refreshPromise = refreshTokens().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (!options.skipAuth) {
    const accessToken = getAccessToken();

    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  try {
    const payload = await parseResponse<T>(response);
    return payload.data;
  } catch (error) {
    const apiError = error as ApiError;

    if (apiError.status === 401 && !options.skipRefresh && !options.retry) {
      try {
        await ensureRefreshed();
        return request<T>(path, { ...options, retry: true });
      } catch {
        logoutAndRedirect();
        throw new ApiError({ code: 401, msg: '登录已失效，请重新登录', data: null, status: 401 });
      }
    }

    throw apiError;
  }
}

export function redirectToLogin() {
  logoutAndRedirect();
}
