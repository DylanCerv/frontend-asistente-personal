import type { JobPollResponse } from '@/types/audio-job';

import { apiRequest } from '../api/api-client';
import { waitForJobCompletion, type JobProgressCallback } from './wait-for-job-completion';

export async function retryJob(
  jobId: string,
  onProgress?: JobProgressCallback,
  signal?: AbortSignal,
): Promise<JobPollResponse> {
  const data = await apiRequest<{ success: boolean; jobId: string }>(`/jobs/${jobId}/retry`, {
    method: 'POST',
  });

  return waitForJobCompletion(data.jobId, onProgress, signal);
}
