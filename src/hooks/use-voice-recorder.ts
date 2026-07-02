import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';

type RecorderState = 'idle' | 'recording' | 'recorded';

export function useVoiceRecorder() {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [state, setState] = useState<RecorderState>('idle');
  const [uri, setUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      void recordingRef.current?.stopAndUnloadAsync();
    };
  }, []);

  const reset = useCallback(() => {
    setUri(null);
    setError(null);
    setState('idle');
    recordingRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);

      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Se necesita permiso de micrófono para grabar');
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      recordingRef.current = recording;
      setUri(null);
      setState('recording');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar la grabación');
      setState('idle');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      const recording = recordingRef.current;
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      const recordedUri = recording.getURI();
      recordingRef.current = null;

      if (!recordedUri) {
        throw new Error('No se pudo guardar la grabación');
      }

      setUri(recordedUri);
      setState('recorded');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo detener la grabación');
      setState('idle');
    }
  }, []);

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
