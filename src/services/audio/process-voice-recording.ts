import type { JobPollResponse, JobResult } from '@/types/audio-job';

import type { JobProgressCallback } from './wait-for-job-completion';
import { uploadAudio } from './upload-audio';
import { waitForJobCompletion } from './wait-for-job-completion';

type ProcessVoiceRecordingOptions = {
  onUploading?: () => void;
  onJobCreated?: (jobId: string) => void;
  onProgress?: JobProgressCallback;
  signal?: AbortSignal;
};

export async function processVoiceRecording(
  audioUri: string,
  options: ProcessVoiceRecordingOptions = {},
): Promise<JobResult> {
  const { onUploading, onJobCreated, onProgress, signal } = options;

  onUploading?.();

  const { jobId } = await uploadAudio(audioUri);
  onJobCreated?.(jobId);
  const job = await waitForJobCompletion(jobId, onProgress, signal);

  if (job.status === 'completed' && job.result) {
    return job.result;
  }

  throw new Error(job.error?.message ?? 'Error al procesar el audio');
}

export type { JobPollResponse };
