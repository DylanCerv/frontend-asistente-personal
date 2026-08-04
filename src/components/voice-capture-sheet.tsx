import Ionicons from '@react-native-vector-icons/ionicons';
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { useBottomInset } from '@/components/screen-safe-area';

import { LIGHT_VOICE_RECORDING_OPTIONS } from '@/constants/voice-recording';
import { useAssistant } from '@/context/assistant-context';
import {
  beginAudioRecordingSession,
  configureRecordingAudioMode,
  ensureMicrophonePermission,
  releaseAudioRecorderSession,
} from '@/services/audio/audio-recorder-session';
import { useUserPreferences } from '@/context/user-preferences-context';
import { useVoiceCapture } from '@/context/voice-capture-context';

type CapturePhase = 'idle' | 'recording' | 'review' | 'processing';

const SEEK_SECONDS = 5;

function formatDuration(durationMillis: number) {
  const totalSeconds = Math.max(0, Math.floor(durationMillis / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function formatSeconds(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = String(Math.floor(safe / 60)).padStart(2, '0');
  const seconds = String(safe % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function VoiceCaptureSheet() {
  const bottomInset = useBottomInset(24);
  const { isOpen, autoStart, closeCapture } = useVoiceCapture();
  const { sendVoiceMessage } = useAssistant();
  const { autoSendVoice } = useUserPreferences();

  const audioRecorder = useAudioRecorder(LIGHT_VOICE_RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(audioRecorder, 250);

  const [phase, setPhase] = useState<CapturePhase>('idle');
  const [savedUri, setSavedUri] = useState<string | null>(null);
  const [recordingDurationMs, setRecordingDurationMs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const player = useAudioPlayer(savedUri);
  const playerStatus = useAudioPlayerStatus(player);

  const recordingStartedAt = useRef<number | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAutoStarted = useRef(false);
  const isStartingRef = useRef(false);
  /** True only after the current session actually started recording (avoids stale recorder URLs). */
  const sawRecordingThisSessionRef = useRef(false);

  const isRecording = phase === 'recording' || recorderState.isRecording;

  const playbackDurationSec = Math.max(
    playerStatus.duration || 0,
    recordingDurationMs / 1000,
  );
  const playbackCurrentSec = playerStatus.currentTime || 0;

  useEffect(() => {
    if (!isOpen) {
      hasAutoStarted.current = false;
      isStartingRef.current = false;
      sawRecordingThisSessionRef.current = false;
      stopRecordingTimer();
      void releaseAudioRecorderSession(audioRecorder);
      setPhase('idle');
      setSavedUri(null);
      setError(null);
      setRecordingDurationMs(0);
      if (playerStatus.playing) player.pause();
      return;
    }

    if (autoStart && !hasAutoStarted.current && phase === 'idle' && !isStartingRef.current) {
      hasAutoStarted.current = true;
      void startRecording();
    }
  }, [isOpen, autoStart, phase]);

  useEffect(() => {
    if (recorderState.isRecording) {
      sawRecordingThisSessionRef.current = true;
      return;
    }

    if (
      !sawRecordingThisSessionRef.current ||
      !recorderState.url ||
      phase !== 'recording'
    ) {
      return;
    }

    sawRecordingThisSessionRef.current = false;

    const durationFromRecorder = recorderState.durationMillis || 0;
    const durationFromTimer = recordingStartedAt.current
      ? Date.now() - recordingStartedAt.current
      : 0;
    const finalDuration = Math.max(durationFromRecorder, durationFromTimer);

    stopRecordingTimer();
    setRecordingDurationMs(finalDuration);
    setSavedUri(recorderState.url);

    if (autoSendVoice) {
      void finishAndSendAudio(recorderState.url);
    } else {
      setPhase('review');
    }
  }, [recorderState.isRecording, recorderState.url, phase, autoSendVoice]);

  useEffect(() => {
    if (savedUri) {
      player.replace(savedUri);
    }
  }, [savedUri, player]);

  useEffect(() => {
    return () => {
      stopRecordingTimer();
    };
  }, []);

  function stopRecordingTimer() {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    recordingStartedAt.current = null;
  }

  function startRecordingTimer() {
    stopRecordingTimer();
    const startedAt = Date.now();
    recordingStartedAt.current = startedAt;
    setRecordingDurationMs(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingDurationMs(Date.now() - startedAt);
    }, 200);
  }

  async function startRecording() {
    if (isStartingRef.current || phase === 'processing') return;
    isStartingRef.current = true;

    try {
      setError(null);
      setSavedUri(null);
      setRecordingDurationMs(0);
      sawRecordingThisSessionRef.current = false;

      const granted = await ensureMicrophonePermission();
      if (!granted) {
        setError('Se necesita permiso de micrófono para grabar.');
        return;
      }

      if (playerStatus.playing) player.pause();

      await releaseAudioRecorderSession(audioRecorder);
      await configureRecordingAudioMode();
      await beginAudioRecordingSession(audioRecorder, LIGHT_VOICE_RECORDING_OPTIONS);
      startRecordingTimer();
      setPhase('recording');
    } catch {
      setError('No se pudo iniciar la grabación. Intenta de nuevo.');
      sawRecordingThisSessionRef.current = false;
      await releaseAudioRecorderSession(audioRecorder);
      setPhase('idle');
    } finally {
      isStartingRef.current = false;
    }
  }

  async function finishAndSendAudio(audioUri: string) {
    sawRecordingThisSessionRef.current = false;
    setPhase('processing');
    setSavedUri(null);
    setRecordingDurationMs(0);
    if (playerStatus.playing) player.pause();
    await releaseAudioRecorderSession(audioRecorder);
    closeCapture();
    try {
      await sendVoiceMessage(audioUri);
    } finally {
      setPhase('idle');
      setSavedUri(null);
      setRecordingDurationMs(0);
    }
  }

  async function handleStopRecording() {
    if (!recorderState.isRecording) return;
    await audioRecorder.stop();
  }

  async function handleSendFromReview() {
    if (!savedUri) return;
    if (playerStatus.playing) player.pause();
    await finishAndSendAudio(savedUri);
  }

  async function handleRecordAgain() {
    if (playerStatus.playing) player.pause();
    sawRecordingThisSessionRef.current = false;
    setSavedUri(null);
    setRecordingDurationMs(0);
    setPhase('idle');
    await releaseAudioRecorderSession(audioRecorder);
    await startRecording();
  }

  async function handleMicPress() {
    if (phase === 'processing') return;

    if (recorderState.isRecording) {
      await handleStopRecording();
      return;
    }

    if (phase === 'review') {
      await handleRecordAgain();
      return;
    }

    await startRecording();
  }

  function handlePlayPress() {
    if (!savedUri) return;
    if (playerStatus.playing) {
      player.pause();
      return;
    }
    void player.seekTo(playbackCurrentSec >= playbackDurationSec - 0.25 ? 0 : playbackCurrentSec);
    player.play();
  }

  async function handleSeekBy(deltaSeconds: number) {
    if (!savedUri || playbackDurationSec <= 0) return;

    const next = Math.min(
      playbackDurationSec,
      Math.max(0, playbackCurrentSec + deltaSeconds),
    );
    await player.seekTo(next);
  }

  function handleClose() {
    stopRecordingTimer();
    isStartingRef.current = false;
    sawRecordingThisSessionRef.current = false;
    void releaseAudioRecorderSession(audioRecorder);
    if (playerStatus.playing) player.pause();
    setSavedUri(null);
    setRecordingDurationMs(0);
    setPhase('idle');
    closeCapture();
  }

  const title =
    phase === 'processing'
      ? 'Un momento...'
      : isRecording
        ? 'Grabando...'
        : phase === 'review'
          ? 'Tu nota de voz'
          : '¿Qué necesitas recordar?';

  const subtitle =
    phase === 'review'
      ? 'Escúchala y envíala cuando quieras.'
      : 'Habla con naturalidad. Kivo se encarga del resto.';

  const progressRatio =
    playbackDurationSec > 0 ? Math.min(1, playbackCurrentSec / playbackDurationSec) : 0;

  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={handleClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="gap-5 rounded-t-[32px] border border-border bg-surface px-6 pt-6 dark:border-border-dark dark:bg-surface-dark"
          style={{ paddingBottom: bottomInset }}>
          <View className="h-1 w-10 self-center rounded-full bg-border dark:bg-border-dark" />

          <View className="items-center gap-2">
            <Text className="text-xl font-bold text-foreground dark:text-foreground-dark">
              {title}
            </Text>
            <Text className="text-center text-sm text-subtle dark:text-subtle-dark">{subtitle}</Text>
          </View>

          {error ? (
            <View className="rounded-2xl border border-danger/30 bg-danger/5 px-4 py-3">
              <Text className="text-center text-sm text-danger dark:text-danger-dark">{error}</Text>
            </View>
          ) : null}

          {phase === 'review' && savedUri ? (
            <View className="gap-4 rounded-[28px] border border-border bg-canvas p-4 dark:border-border-dark dark:bg-canvas-dark">
              <View className="flex-row items-center gap-3">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-surface-soft dark:bg-surface-soft-dark">
                  <Ionicons name="mic-outline" size={23} color="#7C3AED" />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="text-base font-bold text-foreground dark:text-foreground-dark">
                    Nota lista
                  </Text>
                  <Text className="text-xs text-subtle dark:text-subtle-dark">
                    Escúchala antes de enviarla
                  </Text>
                </View>
                <View className="rounded-full bg-surface px-3 py-1 dark:bg-surface-dark">
                  <Text className="text-xs font-semibold text-brand dark:text-brand-dark">
                    {formatDuration(recordingDurationMs)}
                  </Text>
                </View>
              </View>

              <View className="gap-2 rounded-2xl bg-surface px-4 py-3 dark:bg-surface-dark">
                <View className="h-2 overflow-hidden rounded-full bg-muted dark:bg-muted-dark">
                  <View
                    className="h-full rounded-full bg-brand dark:bg-brand-dark"
                    style={{ width: `${progressRatio * 100}%` }}
                  />
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-subtle dark:text-subtle-dark">
                    {formatSeconds(playbackCurrentSec)}
                  </Text>
                  <Text className="text-xs text-subtle dark:text-subtle-dark">
                    {formatSeconds(playbackDurationSec)}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center justify-center gap-3">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Atrasar 5 segundos"
                  onPress={() => void handleSeekBy(-SEEK_SECONDS)}
                  className="h-12 w-12 items-center justify-center rounded-full border border-border bg-surface active:opacity-80 dark:border-border-dark dark:bg-surface-dark">
                  <Ionicons name="play-back-outline" size={22} color="#7C3AED" />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={playerStatus.playing ? 'Pausar' : 'Reproducir'}
                  onPress={handlePlayPress}
                  className="h-16 w-16 items-center justify-center rounded-full bg-brand shadow-sm active:opacity-85 dark:bg-brand-dark">
                  <Ionicons
                    name={playerStatus.playing ? 'pause-outline' : 'play-outline'}
                    size={30}
                    color="#FFFFFF"
                  />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Adelantar 5 segundos"
                  onPress={() => void handleSeekBy(SEEK_SECONDS)}
                  className="h-12 w-12 items-center justify-center rounded-full border border-border bg-surface active:opacity-80 dark:border-border-dark dark:bg-surface-dark">
                  <Ionicons name="play-forward-outline" size={22} color="#7C3AED" />
                </Pressable>
              </View>

              <View className="flex-row items-center gap-3 pt-1">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Grabar de nuevo"
                  onPress={handleRecordAgain}
                  className="min-h-[52px] flex-row items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 active:opacity-80 dark:border-border-dark dark:bg-surface-dark">
                  <Ionicons name="mic-outline" size={22} color="#7C3AED" />
                  <Text className="text-sm font-semibold text-brand dark:text-brand-dark">
                    Repetir
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Enviar"
                  onPress={handleSendFromReview}
                  className="min-h-[52px] flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-brand active:opacity-85 dark:bg-brand-dark">
                  <Ionicons name="paper-plane-outline" size={22} color="#FFFFFF" />
                  <Text className="text-sm font-semibold text-white">Enviar</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {phase !== 'review' ? (
            <View className="items-center gap-4 py-2">
              {phase === 'processing' ? (
                <View className="h-24 w-24 items-center justify-center rounded-full bg-muted dark:bg-muted-dark">
                  <ActivityIndicator size="large" color="#7C3AED" />
                </View>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  onPress={handleMicPress}
                  className={`h-24 w-24 items-center justify-center rounded-full ${
                    isRecording ? 'bg-danger dark:bg-danger-dark' : 'bg-brand dark:bg-brand-dark'
                  } active:opacity-85`}>
                  <Ionicons name={isRecording ? 'stop' : 'mic'} size={40} color="#FFFFFF" />
                </Pressable>
              )}

              {isRecording ? (
                <Text className="text-lg font-semibold text-brand dark:text-brand-dark">
                  {formatDuration(recordingDurationMs)}
                </Text>
              ) : null}
            </View>
          ) : null}

          {phase !== 'review' && phase !== 'processing' ? (
            <Text className="text-center text-xs text-subtle dark:text-subtle-dark">
              {autoSendVoice
                ? 'Se enviará al detener la grabación.'
                : 'Podrás escucharla antes de enviarla.'}
            </Text>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
