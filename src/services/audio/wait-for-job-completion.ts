import { MAX_POLL_DURATION_MS, POLL_INTERVAL_MS } from '@/config/api';
import type { JobPollResponse, JobStatus } from '@/types/audio-job';

import { getJobStatus } from './get-job-status';

export type JobProgressCallback = (progress: number, status: JobStatus) => void;

export async function waitForJobCompletion(
  jobId: string,
  onProgress?: JobProgressCallback,
  signal?: AbortSignal,
): Promise<JobPollResponse> {
  const start = Date.now();

  while (Date.now() - start < MAX_POLL_DURATION_MS) {
    if (signal?.aborted) {
      throw new Error('Processing cancelled');
    }

    const job = await getJobStatus(jobId);
    onProgress?.(job.progress, job.status);

    if (job.status === 'completed' || job.status === 'failed') {
      return job;
    }

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(resolve, POLL_INTERVAL_MS);
      signal?.addEventListener(
        'abort',
        () => {
          clearTimeout(timeout);
          reject(new Error('Processing cancelled'));
        },
        { once: true },
      );
    });
  }

  throw new Error('Job processing timeout');
}
