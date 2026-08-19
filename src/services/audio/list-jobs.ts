import type { ApiDataResponse } from '@/types/api';
import type { CaptureStructuredData, JobStatus } from '@/types/audio-job';

import { apiRequest } from '../api/api-client';

export type CaptureJobRow = {
  id: string;
  user_id: string;
  status: JobStatus;
  progress: number;
  transcription: string | null;
  structured_data: CaptureStructuredData | null;
  error: { message?: string; occurredAt?: string } | null;
  audio_url: string | null;
  created_at: string;
  updated_at: string;
};

type JobsListResponse = ApiDataResponse<CaptureJobRow[]> & { count?: number };

export async function listJobs(
  params: { limit?: number; offset?: number } = {},
): Promise<{ data: CaptureJobRow[]; count: number }> {
  const searchParams = new URLSearchParams();
  searchParams.set('limit', String(params.limit ?? 15));
  if (params.offset !== undefined) searchParams.set('offset', String(params.offset));
  const response = await apiRequest<JobsListResponse>(`/jobs?${searchParams.toString()}`);
  return {
    data: response.data ?? [],
    count: response.count ?? 0,
  };
}
