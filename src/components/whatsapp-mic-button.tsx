/**
 * WhatsApp-style mic button for the chat composer.
 *
 * Behaviour:
 *  - Press & hold → starts recording, shows "Suelta para enviar · ↑ bloquear"
 *  - Release (while holding) → auto-send
 *  - Swipe UP ≥ LOCK_THRESHOLD → locks recording (button release doesn't send)
 *  - Locked mode: Delete | Pause/Resume | ● timer ........... | Send  (exact WhatsApp layout)
 */
import Ionicons from '@react-native-vector-icons/ionicons';
import {
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { LIGHT_VOICE_RECORDING_OPTIONS } from '@/constants/voice-recording';
import { useAssistant } from '@/context/assistant-context';
import {
  beginAudioRecordingSession,
  configureRecordingAudioMode,
  ensureMicrophonePermission,
  releaseAudioRecorderSession,
} from '@/services/audio/audio-recorder-session';

type MicPhase = 'idle' | 'recording_held' | 'recording_locked' | 'sending';

const LOCK_THRESHOLD = -55;
const SPRING_CFG = { damping: 20, stiffness: 260, mass: 0.6 };

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = String(Math.floor(total / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

/** Animated waveform dots — purely cosmetic */
function WaveDots() {
  return (
    <View className="flex-row items-center gap-0.5">
      {[3, 5, 8, 5, 3, 7, 4, 6, 3, 5].map((h, i) => (
        <View
          key={i}
          className="w-0.5 rounded-full bg-brand/50 dark:bg-brand-dark/50"
          style={{ height: h }}
        />
      ))}
    </View>
  );
}

export function WhatsAppMicButton({ disabled = false }: { disabled?: boolean }) {
  const { sendVoiceMessage } = useAssistant();

  const audioRecorder = useAudioRecorder(LIGHT_VOICE_RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(audioRecorder, 200);

  const [phase, setPhase] = useState<MicPhase>('idle');
  const [durationMs, setDurationMs] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showLockHint, setShowLockHint] = useState(false);

  const phaseRef = useRef<MicPhase>('idle');
  const savedUriRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  /** Guard against concurrent startRecording calls from rapid gestures */
  const isStartingRef = useRef(false);

  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => () => clearTimer(), []);

  // When the recorder stops naturally (from stopRecorder call), capture URI
  useEffect(() => {
    if (recorderState.isRecording || !recorderState.url) return;

    const currentPhase = phaseRef.current;

    if (currentPhase === 'recording_held') {
      // Released while holding → auto-send
      savedUriRef.current = recorderState.url;
      clearTimer();
      void dispatchSend(recorderState.url);
    } else if (currentPhase === 'recording_locked') {
      // Stopped because user tapped Send in locked mode
      savedUriRef.current = recorderState.url;
      clearTimer();
      void dispatchSend(recorderState.url);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorderState.isRecording, recorderState.url]);

  // ─── Timer helpers ───────────────────────────────────────────────────────

  function clearTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  function startTimer() {
    clearTimer();
    startTimeRef.current = Date.now();
    pausedAtRef.current = 0;
    setDurationMs(0);
    timerRef.current = setInterval(
      () => setDurationMs(Date.now() - startTimeRef.current - pausedAtRef.current),
      200,
    );
  }

  function pauseTimer() {
    clearTimer();
    pausedAtRef.current += Date.now() - startTimeRef.current;
  }

  function resumeTimer() {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(
      () => setDurationMs(Date.now() - startTimeRef.current - pausedAtRef.current + durationMs - durationMs),
      200,
    );
  }

  // ─── Recording helpers ───────────────────────────────────────────────────

  async function startRecording() {
    if (isStartingRef.current || phaseRef.current !== 'idle') return;
    isStartingRef.current = true;

    try {
      const granted = await ensureMicrophonePermission();
      if (!granted) return;

      await configureRecordingAudioMode();
      await beginAudioRecordingSession(audioRecorder, LIGHT_VOICE_RECORDING_OPTIONS);
      startTimer();
      setPhase('recording_held');
      setShowLockHint(false);
      setIsPaused(false);
    } catch {
      await releaseAudioRecorderSession(audioRecorder);
      setPhase('idle');
    } finally {
      isStartingRef.current = false;
    }
  }

  async function stopRecorder() {
    await releaseAudioRecorderSession(audioRecorder);
    clearTimer();
  }

  async function togglePause() {
    if (isPaused) {
      // Resume
      audioRecorder.record();
      resumeTimer();
      setIsPaused(false);
    } else {
      // Pause
      await audioRecorder.pause();
      pauseTimer();
      setIsPaused(true);
    }
  }

  async function dispatchSend(uri: string) {
    setPhase('sending');
    savedUriRef.current = null;
    setDurationMs(0);
    setIsPaused(false);
    try {
      await sendVoiceMessage(uri);
    } finally {
      setPhase('idle');
    }
  }

  function lockRecording() {
    setPhase('recording_locked');
    setShowLockHint(false);
    translateY.value = withSpring(0, SPRING_CFG);
    scale.value = withSpring(1, SPRING_CFG);
  }

  async function handleCancel() {
    await stopRecorder();
    savedUriRef.current = null;
    setPhase('idle');
    setDurationMs(0);
    setIsPaused(false);
    setShowLockHint(false);
  }

  async function handleSendLocked() {
    setIsPaused(false);
    // Stop recorder → the useEffect above will dispatch send
    await stopRecorder();
  }

  // ─── Gesture ─────────────────────────────────────────────────────────────

  const panGesture = Gesture.Pan()
    .minDistance(0)
    .onBegin(() => {
      scale.value = withSpring(1.2, SPRING_CFG);
      runOnJS(startRecording)();
    })
    .onUpdate((e) => {
      if (phaseRef.current === 'recording_locked') return;
      translateY.value = Math.min(0, e.translationY);
      if (e.translationY < LOCK_THRESHOLD) {
        runOnJS(setShowLockHint)(true);
      } else {
        runOnJS(setShowLockHint)(false);
      }
    })
    .onEnd((e) => {
      if (phaseRef.current === 'recording_locked') return;
      translateY.value = withSpring(0, SPRING_CFG);
      scale.value = withSpring(1, SPRING_CFG);
      if (e.translationY < LOCK_THRESHOLD) {
        runOnJS(lockRecording)();
      } else {
        runOnJS(stopRecorder)();
      }
    })
    .onFinalize(() => {
      translateY.value = withSpring(0, SPRING_CFG);
      scale.value = withSpring(1, SPRING_CFG);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const isActiveRecording = phase === 'recording_held' || phase === 'recording_locked';

  // ─── Locked mode — full-width WhatsApp bar ─────────────────────────────
  if (phase === 'recording_locked') {
    return (
      <View className="flex-1 flex-row items-center gap-2">
        {/* Delete */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancelar grabación"
          onPress={() => void handleCancel()}
          className="h-11 w-11 shrink-0 items-center justify-center rounded-full border border-red-200 bg-red-50 active:opacity-80 dark:border-red-900 dark:bg-red-950">
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </Pressable>

        {/* Pause / Resume */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isPaused ? 'Reanudar grabación' : 'Pausar grabación'}
          onPress={() => void togglePause()}
          className="h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface active:opacity-80 dark:border-border-dark dark:bg-surface-dark">
          <Ionicons
            name={isPaused ? 'play-outline' : 'pause-outline'}
            size={20}
            color="#7C3AED"
          />
        </Pressable>

        {/* Timer + waveform */}
        <View className="flex-1 flex-row items-center gap-2 overflow-hidden rounded-2xl border border-brand/20 bg-surface-soft px-3 py-2.5 dark:border-brand-dark/20 dark:bg-surface-soft-dark">
          <View
            className={`h-2 w-2 rounded-full ${isPaused ? 'bg-subtle' : 'bg-red-500'}`}
          />
          <Text className="min-w-[42px] text-sm font-bold tabular-nums text-brand dark:text-brand-dark">
            {formatDuration(durationMs)}
          </Text>
          <WaveDots />
        </View>

        {/* Send */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enviar audio"
          onPress={() => void handleSendLocked()}
          className="h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand active:opacity-85 dark:bg-brand-dark">
          <Ionicons name="send" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    );
  }

  // ─── Sending indicator ────────────────────────────────────────────────────
  if (phase === 'sending') {
    return (
      <View className="mb-1 h-11 w-11 items-center justify-center rounded-full bg-muted dark:bg-muted-dark">
        <Ionicons name="hourglass-outline" size={18} color="#7C3AED" />
      </View>
    );
  }

  // ─── Default: mic button + hold hint shown inline ─────────────────────────
  return (
    <View className="items-center" style={{ overflow: 'visible' }}>
      {/* Hint shown only while holding (rendered above via absolute, does NOT add layout height) */}
      {isActiveRecording && phase === 'recording_held' ? (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', bottom: '100%', marginBottom: 8, alignSelf: 'center', minWidth: 220 }}
          className="flex-row items-center gap-1.5 self-center rounded-xl border border-border bg-surface px-3 py-2 shadow-sm dark:border-border-dark dark:bg-surface-dark">
          {showLockHint ? (
            <>
              <Ionicons name="lock-closed-outline" size={13} color="#7C3AED" />
              <Text className="text-xs font-semibold text-brand dark:text-brand-dark">
                Suelta para bloquear
              </Text>
            </>
          ) : (
            <>
              <View className="h-1.5 w-1.5 rounded-full bg-red-500" />
              <Text className="text-xs font-bold tabular-nums text-foreground dark:text-foreground-dark">
                {formatDuration(durationMs)}
              </Text>
              <Text className="text-xs text-subtle dark:text-subtle-dark">
                · Suelta para enviar · ↑ bloquear
              </Text>
            </>
          )}
        </View>
      ) : null}

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[animatedStyle, { overflow: 'visible' }]}>
          <View
            accessible
            accessibilityLabel={
              isActiveRecording
                ? `Grabando ${formatDuration(durationMs)}`
                : 'Mantén presionado para grabar'
            }
            accessibilityRole="button"
            className={`mb-1 h-11 w-11 items-center justify-center rounded-full shadow-sm ${
              isActiveRecording
                ? 'bg-red-500'
                : disabled
                  ? 'bg-muted dark:bg-muted-dark'
                  : 'bg-brand dark:bg-brand-dark'
            }`}>
            <Ionicons
              name={isActiveRecording ? 'mic' : 'mic-outline'}
              size={22}
              color={disabled && !isActiveRecording ? '#6B6475' : '#FFFFFF'}
            />
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
