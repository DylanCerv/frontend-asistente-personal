import { apiRequest } from '@/services/api/api-client';
import type { ApiDataResponse } from '@/types/api';

export type ApiProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role_id: number;
  created_at: string;
  updated_at: string;
};

type ProfileResponse = ApiDataResponse<ApiProfile>;

export type UpdateProfilePayload = {
  fullName?: string;
  avatarUrl?: string | null;
};

export async function getMyProfile(): Promise<ApiProfile> {
  const response = await apiRequest<ProfileResponse>('/profiles/me');
  return response.data;
}

export async function updateMyProfile(payload: UpdateProfilePayload): Promise<ApiProfile> {
  const response = await apiRequest<ProfileResponse>('/profiles/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response.data;
}
