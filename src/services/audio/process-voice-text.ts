import type { JobPollResponse, JobResult } from '@/types/audio-job';

import type { JobProgressCallback } from './wait-for-job-completion';
import { submitVoiceText } from './submit-voice-text';
import { waitForJobCompletion } from './wait-for-job-completion';

type ProcessVoiceTextOptions = {
  onSubmitting?: () => void;
  onJobCreated?: (jobId: string) => void;
  onProgress?: JobProgressCallback;
  signal?: AbortSignal;
};

/** Send already-transcribed text to the backend for structured extraction. */
export async function processVoiceText(
  text: string,
  options: ProcessVoiceTextOptions = {},
): Promise<JobResult> {
  const transcription = text.trim();
  if (!transcription) {
    throw new Error('No hay texto para procesar');
  }

  const { onSubmitting, onJobCreated, onProgress, signal } = options;

  onSubmitting?.();
  const { jobId } = await submitVoiceText(transcription);
  onJobCreated?.(jobId);

  const job = await waitForJobCompletion(jobId, onProgress, signal);

  if (job.status === 'completed' && job.result) {
    return {
      ...job.result,
      transcription: job.result.transcription || transcription,
    };
  }

  throw new Error(job.error?.message ?? 'Error al procesar el texto');
}

export type { JobPollResponse };
