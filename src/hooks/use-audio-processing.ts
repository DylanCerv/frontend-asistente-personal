import { useCallback, useEffect, useRef, useState } from 'react';

import { processVoiceRecording } from '@/services/audio/process-voice-recording';
import { retryJob } from '@/services/audio/retry-job';
import type { AudioProcessingUiState, JobResult } from '@/types/audio-job';
import { getApiErrorMessage, getStatusMessage } from '@/utils/job-status-message';

export function useAudioProcessing() {
  const abortRef = useRef<AbortController | null>(null);
  const [uiState, setUiState] = useState<AudioProcessingUiState>('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<JobResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  useEffect(() => {
    return () => cancel();
  }, [cancel]);

  const reset = useCallback(() => {
    cancel();
    setUiState('idle');
    setProgress(0);
    setMessage('');
    setResult(null);
    setError(null);
    setJobId(null);
  }, [cancel]);

  const handleProgress = useCallback((nextProgress: number, status: Parameters<typeof getStatusMessage>[0]) => {
    setProgress(nextProgress);
    setMessage(getStatusMessage(status, nextProgress));
  }, []);

  const processRecording = useCallback(
    async (audioUri: string) => {
      cancel();
      const controller = new AbortController();
      abortRef.current = controller;

      setUiState('uploading');
      setMessage('Subiendo audio...');
      setProgress(0);
      setError(null);
      setResult(null);

      try {
        const jobResult = await processVoiceRecording(audioUri, {
          onUploading: () => {
            setUiState('uploading');
            setMessage('Subiendo audio...');
          },
          onJobCreated: (id) => setJobId(id),
          onProgress: (nextProgress, status) => {
            setUiState('processing');
            handleProgress(nextProgress, status);
          },
          signal: controller.signal,
        });

        setUiState('done');
        setProgress(100);
        setMessage('Listo');
        setResult(jobResult);
      } catch (err) {
        setUiState('error');
        setError(getApiErrorMessage(err));
      }
    },
    [cancel, handleProgress],
  );

  const retry = useCallback(async () => {
    if (!jobId) return;

    cancel();
    const controller = new AbortController();
    abortRef.current = controller;

    setUiState('processing');
    setMessage('Procesando...');
    setError(null);

    try {
      const job = await retryJob(jobId, (nextProgress, status) => {
        handleProgress(nextProgress, status);
      }, controller.signal);

      if (job.status === 'completed' && job.result) {
        setUiState('done');
        setProgress(100);
        setMessage('Listo');
        setResult(job.result);
        return;
      }

      throw new Error(job.error?.message ?? 'Error al procesar el audio');
    } catch (err) {
      setUiState('error');
      setError(getApiErrorMessage(err));
    }
  }, [cancel, handleProgress, jobId]);

  return {
    uiState,
    progress,
    message,
    result,
    error,
    jobId,
    setJobId,
    isBusy: uiState === 'uploading' || uiState === 'processing',
    processRecording,
    retry,
    reset,
    cancel,
  };
}
