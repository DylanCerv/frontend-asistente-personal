import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { useCallback, useEffect, useState } from 'react';

type RecorderState = 'idle' | 'recording' | 'recorded';

export function useVoiceRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [state, setState] = useState<RecorderState>('idle');
  const [uri, setUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (recorder.getStatus().isRecording) {
        void recorder.stop();
      }
    };
  }, [recorder]);

  const reset = useCallback(() => {
    setUri(null);
    setError(null);
    setState('idle');
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);

      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Se necesita permiso de micrófono para grabar');
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      const status = recorder.getStatus();
      if (!status.canRecord) {
        await recorder.prepareToRecordAsync();
      }

      recorder.record();
      setUri(null);
      setState('recording');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar la grabación');
      setState('idle');
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
