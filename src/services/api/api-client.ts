import { API_BASE_URL } from '@/config/api';

import { ApiError, handleUnauthorized } from './api-error';
import { getAuthHeaders } from './get-auth-headers';

type ApiRequestOptions = RequestInit & {
  skipAuth?: boolean;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { skipAuth, headers, ...rest } = options;

  const authHeaders = skipAuth ? {} : await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      ...authHeaders,
      ...headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    handleUnauthorized(response.status);
    const message =
      (data as { error?: { message?: string } }).error?.message ?? 'Request failed';
    throw new ApiError(message, response.status);
  }

  return data as T;
}
