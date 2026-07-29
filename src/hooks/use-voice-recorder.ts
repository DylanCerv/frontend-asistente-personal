import {
  RecordingPresets,
  useAudioRecorder,
} from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  beginAudioRecordingSession,
  configureRecordingAudioMode,
  ensureMicrophonePermission,
  releaseAudioRecorderSession,
} from '@/services/audio/audio-recorder-session';

type RecorderState = 'idle' | 'recording' | 'recorded';

export function useVoiceRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [state, setState] = useState<RecorderState>('idle');
  const [uri, setUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isStartingRef = useRef(false);
  const stateRef = useRef<RecorderState>(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    return () => {
      void releaseAudioRecorderSession(recorder);
    };
  }, [recorder]);

  const reset = useCallback(() => {
    setUri(null);
    setError(null);
    setState('idle');
  }, []);

  const startRecording = useCallback(async () => {
    if (isStartingRef.current || stateRef.current === 'recording') {
      return;
    }

    isStartingRef.current = true;

    try {
      setError(null);

      const granted = await ensureMicrophonePermission();
      if (!granted) {
        throw new Error('Se necesita permiso de micrófono para grabar');
      }

      await configureRecordingAudioMode();
      // Release any previous session so Android can prepare/record again safely.
      await releaseAudioRecorderSession(recorder);
      await beginAudioRecordingSession(recorder, RecordingPresets.HIGH_QUALITY);

      setUri(null);
      setState('recording');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar la grabación');
      setState('idle');
      await releaseAudioRecorderSession(recorder);
    } finally {
      isStartingRef.current = false;
    }
  }, [recorder]);

  const stopRecording = useCallback(async () => {
    try {
      await recorder.stop();
      const recordedUri = recorder.uri;

      if (!recordedUri) {
        throw new Error('No se pudo guardar la grabación');
      }

      setUri(recordedUri);
      setState('recorded');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo detener la grabación');
      setState('idle');
      await releaseAudioRecorderSession(recorder);
    }
  }, [recorder]);

  return {
    state,
    uri,
    error,
    isRecording: state === 'recording',
    hasRecording: state === 'recorded' && uri !== null,
    startRecording,
    stopRecording,
    reset,
  };
}
