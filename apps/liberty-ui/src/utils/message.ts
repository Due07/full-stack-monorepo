import type { ApiError } from '@/types/api';

export function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as ApiError).message;
  }

  return '请求失败，请稍后重试';
}