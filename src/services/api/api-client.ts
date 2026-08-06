import { API_BASE_URL } from '@/config/api';

import { ApiError, handleUnauthorized } from './api-error';
import { getAuthHeaders } from './get-auth-headers';

type ApiRequestOptions = RequestInit & {
  skipAuth?: boolean;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { skipAuth, headers, ...rest } = options;

  const authHeaders = skipAuth ? {} : await getAuthHeaders();

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: {
        ...authHeaders,
        ...headers,
      },
    });
  } catch (error) {
    const detail =
      error instanceof Error && error.message ? ` (${error.message})` : '';
    throw new ApiError(
      `No se pudo conectar con el servidor (${API_BASE_URL})${detail}. Revisa que el backend esté en marcha.`,
      0,
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    handleUnauthorized(response.status);
    const message =
      (data as { error?: { message?: string } }).error?.message ?? 'Request failed';
    throw new ApiError(message, response.status);
  }

  return data as T;
}
