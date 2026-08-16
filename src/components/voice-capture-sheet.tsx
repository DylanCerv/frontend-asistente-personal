import Ionicons from '@react-native-vector-icons/ionicons';
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useSegments } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { VoiceWaveform } from '@/components/assistant/voice-waveform';
import { KeyboardIcon } from '@/components/icons/keyboard-icon';
import { useBottomInset } from '@/components/screen-safe-area';
import {
  APP_ACCENT,
  APP_BORDER,
  APP_DANGER,
  APP_ON_ACCENT,
  APP_SURFACE,
  APP_SURFACE_SOFT,
  APP_TEXT_MUTED,
} from '@/constants/app-colors';
import {
  isVoiceRecordingTooShort,
  LIGHT_VOICE_RECORDING_OPTIONS,
  SHORT_VOICE_RECORDING_MESSAGE,
} from '@/constants/voice-recording';
import { useAssistant } from '@/context/assistant-context';
import { useUserPreferences } from '@/context/user-preferences-context';
import { useVoiceCapture } from '@/context/voice-capture-context';
import {
  beginAudioRecordingSession,
  configureRecordingAudioMode,
  ensureMicrophonePermission,
  releaseAudioRecorderSession,
} from '@/services/audio/audio-recorder-session';

type CapturePhase = 'idle' | 'recording' | 'review' | 'processing';

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
  const bottomInset = useBottomInset(20);
  const segments = useSegments();
  const routeKey = segments.join('/');
  const routeKeyRef = useRef(routeKey);
  const { isOpen, autoStart, closeCapture } = useVoiceCapture();
  const { sendVoiceMessage, sendTextMessage, isProcessing } = useAssistant();
  const { autoSendVoice } = useUserPreferences();

  const audioRecorder = useAudioRecorder(LIGHT_VOICE_RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(audioRecorder, 250);

  const [phase, setPhase] = useState<CapturePhase>('idle');
  const [savedUri, setSavedUri] = useState<string | null>(null);
  const [recordingDurationMs, setRecordingDurationMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [isSendingText, setIsSendingText] = useState(false);

  const player = useAudioPlayer(savedUri);
  const playerStatus = useAudioPlayerStatus(player);

  const recordingStartedAt = useRef<number | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAutoStarted = useRef(false);
  const isStartingRef = useRef(false);
  /** True only after the current session actually started recording (avoids stale recorder URLs). */
  const sawRecordingThisSessionRef = useRef(false);

  const isRecording = phase === 'recording' || recorderState.isRecording;
  const canSendText =
    textInput.trim().length > 0 &&
    !isRecording &&
    phase !== 'processing' &&
    !isProcessing &&
    !isSendingText;

  const playbackDurationSec =
    playerStatus.duration > 0 ? playerStatus.duration : recordingDurationMs / 1000;
  const playbackCurrentSec = playerStatus.currentTime || 0;
  const isPlaybackFinished =
    playerStatus.didJustFinish ||
    (playbackDurationSec > 0 && playbackCurrentSec >= Math.max(0, playbackDurationSec - 0.08));
  const progressRatio =
    playbackDurationSec > 0
      ? Math.min(1, isPlaybackFinished ? 1 : playbackCurrentSec / playbackDurationSec)
      : 0;
  const displayCurrentSec = isPlaybackFinished ? playbackDurationSec : playbackCurrentSec;

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
      setTextInput('');
      setIsSendingText(false);
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

    if (isVoiceRecordingTooShort(finalDuration)) {
      setSavedUri(null);
      setPhase('idle');
      setError(SHORT_VOICE_RECORDING_MESSAGE);
      void releaseAudioRecorderSession(audioRecorder);
      return;
    }

    setError(null);
    setSavedUri(recorderState.url);

    if (autoSendVoice) {
      void finishAndSendAudio(recorderState.url, finalDuration);
    } else {
      setPhase('review');
    }
  }, [recorderState.isRecording, recorderState.url, phase, autoSendVoice]);

  useEffect(() => {
    if (phase !== 'review' || !savedUri) return;

    let cancelled = false;

    void (async () => {
      try {
        await releaseAudioRecorderSession(audioRecorder);
        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
        });
        if (!cancelled) {
          player.replace(savedUri);
        }
      } catch {
        // Review UI stays available even if audio mode switch fails.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [phase, savedUri, audioRecorder, player]);

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

  async function finishAndSendAudio(audioUri: string, durationMs = recordingDurationMs) {
    if (!audioUri || isVoiceRecordingTooShort(durationMs)) {
      setError(SHORT_VOICE_RECORDING_MESSAGE);
      setPhase('idle');
      setSavedUri(null);
      setRecordingDurationMs(0);
      return;
    }

    sawRecordingThisSessionRef.current = false;
    setPhase('processing');
    setSavedUri(null);
    setRecordingDurationMs(0);
    setError(null);
    if (playerStatus.playing) player.pause();
    await releaseAudioRecorderSession(audioRecorder);

    try {
      await sendVoiceMessage(audioUri);
    } catch {
      setError('No se pudo procesar el audio. Intenta de nuevo.');
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
    if (!savedUri || isProcessing || phase === 'processing') return;
    if (isVoiceRecordingTooShort(recordingDurationMs)) {
      setError(SHORT_VOICE_RECORDING_MESSAGE);
      handleDeleteFromReview();
      return;
    }
    if (playerStatus.playing) player.pause();
    await finishAndSendAudio(savedUri, recordingDurationMs);
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

  function handleDeleteFromReview() {
    if (playerStatus.playing) player.pause();
    sawRecordingThisSessionRef.current = false;
    setSavedUri(null);
    setRecordingDurationMs(0);
    setError(null);
    setPhase('idle');
    void releaseAudioRecorderSession(audioRecorder);
  }

  async function handleMicPress() {
    if (phase === 'processing') return;
    setError(null);

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

  async function handlePlayPress() {
    if (!savedUri || phase !== 'review') return;

    try {
      if (playerStatus.playing) {
        player.pause();
        return;
      }

      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });

      const duration = playerStatus.duration > 0 ? playerStatus.duration : recordingDurationMs / 1000;
      const current = playerStatus.currentTime || 0;
      const atEnd =
        playerStatus.didJustFinish || (duration > 0 && current >= Math.max(0, duration - 0.15));

      if (atEnd || current <= 0.02) {
        await player.seekTo(0);
      }

      player.play();
    } catch {
      setError('No se pudo reproducir el audio. Intenta de nuevo.');
    }
  }

  async function handleSendText() {
    const text = textInput.trim();
    if (!text || !canSendText) return;

    setIsSendingText(true);
    setError(null);
    setTextInput('');
    try {
      await sendTextMessage(text);
    } catch {
      setError('No se pudo enviar el mensaje. Intenta de nuevo.');
      setTextInput(text);
    } finally {
      setIsSendingText(false);
    }
  }

  function handleClose() {
    stopRecordingTimer();
    isStartingRef.current = false;
    sawRecordingThisSessionRef.current = false;
    void releaseAudioRecorderSession(audioRecorder);
    if (playerStatus.playing) player.pause();
    setSavedUri(null);
    setRecordingDurationMs(0);
    setTextInput('');
    setError(null);
    setPhase('idle');
    closeCapture();
  }

  useEffect(() => {
    if (!isOpen) {
      routeKeyRef.current = routeKey;
      return;
    }

    if (routeKeyRef.current !== routeKey) {
      routeKeyRef.current = routeKey;
      handleClose();
      return;
    }

    routeKeyRef.current = routeKey;
  }, [routeKey, isOpen]);

  const statusLabel =
    phase === 'processing'
      ? 'Procesando...'
      : isRecording
        ? 'Grabando'
        : phase === 'review'
          ? 'Revisa tu nota'
          : 'Captura rápida';

  return (
    <Modal visible={isOpen} animationType="fade" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable
          className="flex-1 justify-end px-4"
          style={{ backgroundColor: 'rgba(5, 5, 5, 0.72)' }}
          onPress={handleClose}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{ marginBottom: bottomInset }}>
            <View
              style={{
                borderRadius: 24,
                borderWidth: 1,
                borderColor: APP_BORDER,
                backgroundColor: APP_SURFACE,
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius: 16,
                elevation: 12,
              }}>
              <View className="gap-3 px-4 pb-4 pt-3.5">
                <View className="flex-row items-center justify-between gap-2">
                  <View className="min-w-0 flex-1 flex-row items-center gap-2">
                    <View
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: isRecording
                          ? APP_DANGER
                          : phase === 'processing'
                            ? APP_ACCENT
                            : APP_TEXT_MUTED,
                      }}
                    />
                    <Text className="text-[15px] font-bold text-white" numberOfLines={1}>
                      {statusLabel}
                    </Text>
                    {isRecording ? (
                      <Text
                        className="text-[12px] font-bold tabular-nums"
                        style={{ color: APP_DANGER }}>
                        {formatDuration(recordingDurationMs)}
                      </Text>
                    ) : null}
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Cerrar captura"
                    onPress={handleClose}
                    hitSlop={8}
                    className="h-8 w-8 items-center justify-center rounded-full active:opacity-70"
                    style={{ backgroundColor: APP_SURFACE_SOFT }}>
                    <Ionicons name="close" size={15} color={APP_TEXT_MUTED} />
                  </Pressable>
                </View>

                {error ? (
                  <Pressable onPress={() => setError(null)} accessibilityRole="button">
                    <Text className="text-[12px]" style={{ color: APP_DANGER }}>
                      {error}
                    </Text>
                  </Pressable>
                ) : null}

                {phase === 'review' && savedUri ? (
                  <View
                    className="gap-2.5 rounded-2xl border px-3 py-3"
                    style={{ borderColor: APP_BORDER, backgroundColor: APP_SURFACE_SOFT }}>
                    <View className="flex-row items-center gap-3">
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={playerStatus.playing ? 'Pausar' : 'Reproducir'}
                        onPress={() => void handlePlayPress()}
                        className="h-11 w-11 items-center justify-center rounded-full active:opacity-85"
                        style={{ backgroundColor: APP_ACCENT }}>
                        <Ionicons
                          name={playerStatus.playing ? 'pause' : 'play'}
                          size={20}
                          color={APP_ON_ACCENT}
                        />
                      </Pressable>

                      <View className="min-w-0 flex-1 gap-1">
                        <View className="flex-row items-center justify-between gap-2">
                          <Text className="text-[13px] font-semibold text-white">Nota lista</Text>
                          <Text
                            className="text-[11px] font-semibold tabular-nums"
                            style={{ color: APP_TEXT_MUTED }}>
                            {formatSeconds(displayCurrentSec)} /{' '}
                            {formatSeconds(playbackDurationSec)}
                          </Text>
                        </View>
                        <View
                          className="h-1 overflow-hidden rounded-full"
                          style={{ backgroundColor: APP_BORDER }}>
                          <View
                            className="h-full rounded-full"
                            style={{
                              width: `${progressRatio * 100}%`,
                              backgroundColor: APP_ACCENT,
                            }}
                          />
                        </View>
                      </View>
                    </View>

                    <View className="flex-row items-center gap-2">
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Eliminar audio"
                        onPress={handleDeleteFromReview}
                        className="h-11 flex-1 items-center justify-center rounded-xl border active:opacity-80"
                        style={{ borderColor: APP_BORDER, backgroundColor: APP_SURFACE }}>
                        <Ionicons name="trash-outline" size={18} color={APP_DANGER} />
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Grabar de nuevo"
                        onPress={() => void handleRecordAgain()}
                        className="h-11 flex-1 items-center justify-center rounded-xl border active:opacity-80"
                        style={{ borderColor: APP_BORDER, backgroundColor: APP_SURFACE }}>
                        <Ionicons name="refresh-outline" size={18} color={APP_ACCENT} />
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Enviar audio"
                        disabled={isProcessing || phase === 'processing'}
                        onPress={() => void handleSendFromReview()}
                        className="h-11 flex-[1.35] flex-row items-center justify-center gap-1.5 rounded-xl active:opacity-85"
                        style={{
                          backgroundColor: APP_ACCENT,
                          opacity: isProcessing || phase === 'processing' ? 0.55 : 1,
                        }}>
                        {phase === 'processing' || isProcessing ? (
                          <ActivityIndicator color={APP_ON_ACCENT} />
                        ) : (
                          <>
                            <Ionicons name="paper-plane" size={16} color={APP_ON_ACCENT} />
                            <Text className="text-[13px] font-bold" style={{ color: APP_ON_ACCENT }}>
                              Enviar
                            </Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View
                    className="flex-row items-center gap-3 rounded-2xl border px-3 py-2.5"
                    style={{
                      borderColor: isRecording ? 'rgba(248, 113, 113, 0.35)' : APP_BORDER,
                      backgroundColor: APP_SURFACE_SOFT,
                    }}>
                    <View className="min-w-0 flex-1">
                      <VoiceWaveform
                        compact
                        active={isRecording || phase === 'processing'}
                      />
                    </View>
                    {phase === 'processing' ? (
                      <View
                        className="h-11 w-11 items-center justify-center rounded-full"
                        style={{ backgroundColor: 'rgba(196, 181, 253, 0.12)' }}>
                        <ActivityIndicator color={APP_ACCENT} />
                      </View>
                    ) : (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={isRecording ? 'Detener grabación' : 'Grabar audio'}
                        onPress={() => void handleMicPress()}
                        className="h-11 w-11 items-center justify-center rounded-full active:opacity-90"
                        style={{
                          backgroundColor: isRecording ? APP_DANGER : APP_ACCENT,
                          shadowColor: isRecording ? APP_DANGER : APP_ACCENT,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.35,
                          shadowRadius: 8,
                          elevation: 6,
                        }}>
                        <Ionicons
                          name={isRecording ? 'stop' : 'mic'}
                          size={20}
                          color={isRecording ? '#FFFFFF' : APP_ON_ACCENT}
                        />
                      </Pressable>
                    )}
                  </View>
                )}

                <View
                  className="flex-row items-center gap-2.5 rounded-2xl border px-3"
                  style={{
                    backgroundColor: APP_SURFACE_SOFT,
                    borderColor: APP_BORDER,
                    minHeight: 46,
                  }}>
                  <KeyboardIcon size={15} color={APP_TEXT_MUTED} />
                  <TextInput
                    value={textInput}
                    onChangeText={(text) => {
                      setError(null);
                      setTextInput(text);
                    }}
                    onFocus={() => setError(null)}
                    placeholder="Escribe tu tarea aquí..."
                    placeholderTextColor={APP_TEXT_MUTED}
                    editable={!isSendingText && phase !== 'processing'}
                    onSubmitEditing={() => void handleSendText()}
                    returnKeyType="send"
                    className="flex-1 py-2.5 text-[14px] text-white"
                  />
                  {canSendText ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Enviar mensaje"
                      onPress={() => void handleSendText()}
                      className="h-8 w-8 items-center justify-center rounded-full active:opacity-80"
                      style={{ backgroundColor: APP_ACCENT }}>
                      <Ionicons name="arrow-up" size={15} color={APP_ON_ACCENT} />
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
