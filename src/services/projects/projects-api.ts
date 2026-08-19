import type { ApiDataResponse } from '@/types/api';
import { apiRequest } from '@/services/api/api-client';

export type ApiProject = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateProjectPayload = {
  title: string;
  description?: string | null;
};

export async function listProjects(): Promise<ApiProject[]> {
  const response = await apiRequest<ApiDataResponse<ApiProject[]> & { count?: number }>(
    '/projects',
  );
  return response.data ?? [];
}

export async function createProject(payload: CreateProjectPayload): Promise<ApiProject> {
  const response = await apiRequest<ApiDataResponse<ApiProject>>('/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response.data;
}
