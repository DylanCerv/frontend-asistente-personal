import { apiRequest } from '@/services/api/api-client';
import type { ApiDataResponse } from '@/types/api';

export type AppFeedback = {
  id: string;
  user_id: string;
  rating: number;
  comment: string;
  app_version: string;
  created_at: string;
  updated_at: string;
};

export type SubmitFeedbackPayload = {
  rating: number;
  comment?: string;
  app_version?: string;
};

type FeedbackResponse = ApiDataResponse<AppFeedback | null>;
type SubmitResponse = ApiDataResponse<AppFeedback>;

export async function getMyFeedback(): Promise<AppFeedback | null> {
  const response = await apiRequest<FeedbackResponse>('/feedback/me');
  return response.data ?? null;
}

export async function submitFeedback(payload: SubmitFeedbackPayload): Promise<AppFeedback> {
  const response = await apiRequest<SubmitResponse>('/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response.data;
}
