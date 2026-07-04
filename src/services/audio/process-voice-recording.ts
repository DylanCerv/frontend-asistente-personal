import type { JobPollResponse, JobResult } from '@/types/audio-job';

import type { JobProgressCallback } from './wait-for-job-completion';
import { uploadAudio } from './upload-audio';
import { waitForJobCompletion } from './wait-for-job-completion';

type ProcessVoiceRecordingOptions = {
  onUploading?: () => void;
  onTranscribing?: () => void;
  onJobCreated?: (jobId: string) => void;
  onProgress?: JobProgressCallback;
  signal?: AbortSignal;
};

/** Always uploads a lightweight speech clip; the backend handles transcription. */
export async function processVoiceRecording(
  audioUri: string,
  options: ProcessVoiceRecordingOptions = {},
): Promise<JobResult> {
  const { onUploading, onTranscribing, onJobCreated, onProgress, signal } = options;

  onTranscribing?.();
  onUploading?.();

  const { jobId } = await uploadAudio(audioUri);
  onJobCreated?.(jobId);

  const job = await waitForJobCompletion(jobId, onProgress, signal);

  if (job.status === 'completed' && job.result) {
    return job.result;
  }

  throw new Error(job.error?.message ?? 'No se pudo procesar tu nota de voz');
}

export type { JobPollResponse };
