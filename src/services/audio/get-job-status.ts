import type { JobPollResponse } from '@/types/audio-job';

import { apiRequest } from '../api/api-client';

export async function getJobStatus(jobId: string): Promise<JobPollResponse> {
  return apiRequest<JobPollResponse>(`/jobs/${jobId}`);
}
