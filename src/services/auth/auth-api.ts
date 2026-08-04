import type { ApiDataResponse, ApiUser, AuthPayload } from '@/types/api';

import { apiRequest } from '../api/api-client';

type MeResponse = ApiDataResponse<{ user: ApiUser }>;

export async function loginRequest(email: string, password: string): Promise<AuthPayload> {
  const response = await apiRequest<ApiDataResponse<AuthPayload>>('/auth/login', {
    method: 'POST',
    skipAuth: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  return response.data;
}

export async function registerRequest(
  email: string,
  password: string,
  fullName: string,
): Promise<AuthPayload> {
  const response = await apiRequest<ApiDataResponse<AuthPayload & { message?: string }>>(
    '/auth/register',
    {
      method: 'POST',
      skipAuth: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName }),
    },
  );

  return response.data;
}

export async function refreshSessionRequest(refreshToken: string): Promise<AuthPayload> {
  const response = await apiRequest<ApiDataResponse<AuthPayload>>('/auth/refresh', {
    method: 'POST',
    skipAuth: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  return response.data;
}

export async function getMeRequest(): Promise<ApiUser> {
  const response = await apiRequest<MeResponse>('/auth/me');
  return response.data.user;
}

export async function googleSignInRequest(idToken: string): Promise<AuthPayload> {
  const response = await apiRequest<ApiDataResponse<AuthPayload>>('/auth/google', {
    method: 'POST',
    skipAuth: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  return response.data;
}

export async function appleSignInRequest(
  idToken: string,
  nonce: string,
): Promise<AuthPayload> {
  const response = await apiRequest<ApiDataResponse<AuthPayload>>('/auth/apple', {
    method: 'POST',
    skipAuth: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, nonce }),
  });

  return response.data;
}

export async function changePasswordRequest(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await apiRequest('/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}
