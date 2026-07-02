import Ionicons from '@react-native-vector-icons/ionicons';
import {
  AudioQuality,
  IOSOutputFormat,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
  type RecordingOptions,
} from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { useBottomInset } from '@/components/screen-safe-area';

import { useAssistant } from '@/context/assistant-context';
import { useUserPreferences } from '@/context/user-preferences-context';
import { useVoiceCapture } from '@/context/voice-capture-context';

const VOICE_RECORDING_OPTIONS: RecordingOptions = {
  extension: '.m4a',
  sampleRate: 32000,
  numberOfChannels: 1,
  bitRate: 48000,
  isMeteringEnabled: true,
  android: {
    extension: '.m4a',
    outputFormat: 'mpeg4',
    audioEncoder: 'aac',
    audioSource: 'voice_recognition',
  },
  ios: {
    extension: '.m4a',
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: AudioQuality.MEDIUM,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 64000,
  },
};

type CapturePhase = 'idle' | 'recording' | 'review' | 'processing';

function formatDuration(durationMillis: number) {
  const totalSeconds = Math.max(0, Math.floor(durationMillis / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function VoiceCaptureSheet() {
  const bottomInset = useBottomInset(24);
  const { isOpen, autoStart, closeCapture } = useVoiceCapture();
  const { sendVoiceMessage } = useAssistant();
  const { autoSendVoice } = useUserPreferences();

  const audioRecorder = useAudioRecorder(VOICE_RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(audioRecorder, 250);

  const [phase, setPhase] = useState<CapturePhase>('idle');
  const [savedUri, setSavedUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const player = useAudioPlayer(savedUri);
  const playerStatus = useAudioPlayerStatus(player);
  const hasAutoStarted = useRef(false);

  const isRecording = recorderState.isRecording;

  useEffect(() => {
    if (!isOpen) {
      hasAutoStarted.current = false;
      setPhase('idle');
      setSavedUri(null);
      setRecordingDuration(0);
      if (playerStatus.playing) {
        player.pause();
      }
      return;
    }

    if (autoStart && !hasAutoStarted.current && phase === 'idle') {
      hasAutoStarted.current = true;
      startRecording();
    }
  }, [isOpen, autoStart, phase]);

  useEffect(() => {
    if (!isRecording && recorderState.url && phase === 'recording') {
      setSavedUri(recorderState.url);
      setRecordingDuration(recorderState.durationMillis);

      if (autoSendVoice && recorderState.url) {
        finishAndSend(recorderState.url);
      } else {
        setPhase('review');
      }
    }
  }, [isRecording, recorderState.url, phase, autoSendVoice]);

  useEffect(() => {
    if (savedUri) {
      player.replace(savedUri);
    }
  }, [savedUri, player]);

  async function startRecording() {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) return;

    setSavedUri(null);
    setRecordingDuration(0);
    if (playerStatus.playing) {
      player.pause();
    }

    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
      interruptionMode: 'duckOthers',
    });

    await audioRecorder.prepareToRecordAsync(VOICE_RECORDING_OPTIONS);
    audioRecorder.record();
    setPhase('recording');
  }

  async function finishAndSend(audioUri: string) {
    setPhase('processing');
    closeCapture();
    await sendVoiceMessage(audioUri);
    setPhase('idle');
  }

  async function handleStopRecording() {
    if (!isRecording) return;
    await audioRecorder.stop();
  }

  async function handleSendFromReview() {
    if (!savedUri) return;

    if (playerStatus.playing) {
      player.pause();
    }
    await finishAndSend(savedUri);
  }

  async function handleRecordAgain() {
    if (playerStatus.playing) {
      player.pause();
    }
    setSavedUri(null);
    await startRecording();
  }

  function handlePlayPress() {
    if (!savedUri) return;

    if (playerStatus.playing) {
      player.pause();
      return;
    }

    player.play();
  }

  async function handleMicPress() {
    if (phase === 'processing') return;

    if (isRecording) {
      await handleStopRecording();
      return;
    }

    if (phase === 'review') {
      await handleRecordAgain();
      return;
    }

    await startRecording();
  }

  function handleClose() {
    if (isRecording) {
      audioRecorder.stop().catch(() => {});
    }
    if (playerStatus.playing) {
      player.pause();
    }
    closeCapture();
  }

  const title =
    phase === 'processing'
      ? 'Procesando...'
      : isRecording
        ? 'Escuchando...'
        : phase === 'review'
          ? 'Revisa tu audio'
          : '¿Qué necesitas recordar?';

  const subtitle =
    phase === 'review'
      ? 'Escucha tu grabación y envíala cuando estés listo.'
      : 'Habla naturalmente. La IA organiza todo por ti.';

  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={handleClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="gap-5 rounded-t-[32px] border border-border bg-surface px-6 pt-6 dark:border-border-dark dark:bg-surface-dark"
          style={{ paddingBottom: bottomInset }}>
          <View className="self-center h-1 w-10 rounded-full bg-border dark:bg-border-dark" />

          <View className="items-center gap-2">
            <Text className="text-xl font-bold text-foreground dark:text-foreground-dark">
              {title}
            </Text>
            <Text className="text-center text-sm text-subtle dark:text-subtle-dark">{subtitle}</Text>
          </View>

          {phase === 'review' && savedUri ? (
            <View className="gap-4 rounded-[24px] border border-border bg-canvas p-4 dark:border-border-dark dark:bg-canvas-dark">
              <View className="flex-row items-center gap-3">
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-muted dark:bg-muted-dark">
                  <Ionicons name="musical-notes-outline" size={22} color="#7C3AED" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
                    Audio listo
                  </Text>
                  <Text className="text-xs text-subtle dark:text-subtle-dark">
                    Duración {formatDuration(recordingDuration)}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between gap-2">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={playerStatus.playing ? 'Pausar audio' : 'Escuchar audio'}
                  onPress={handlePlayPress}
                  className="min-h-[52px] flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-surface-soft active:opacity-80 dark:bg-surface-soft-dark">
                  <Ionicons
                    name={playerStatus.playing ? 'pause-outline' : 'play-outline'}
                    size={22}
                    color="#7C3AED"
                  />
                  <Text className="text-sm font-semibold text-brand dark:text-brand-dark">
                    {playerStatus.playing ? 'Pausar' : 'Escuchar'}
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Enviar audio"
                  onPress={handleSendFromReview}
                  className="h-[52px] w-[52px] items-center justify-center rounded-2xl bg-brand active:opacity-85 dark:bg-brand-dark">
                  <Ionicons name="paper-plane-outline" size={22} color="#FFFFFF" />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Grabar otro audio"
                  onPress={handleRecordAgain}
                  className="h-[52px] w-[52px] items-center justify-center rounded-2xl border border-border bg-surface active:opacity-80 dark:border-border-dark dark:bg-surface-dark">
                  <Ionicons name="mic-outline" size={22} color="#7C3AED" />
                </Pressable>
              </View>
            </View>
          ) : (
            <View className="items-center gap-4 py-4">
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
                  <Ionicons
                    name={isRecording ? 'stop' : phase === 'review' ? 'mic' : 'mic'}
                    size={40}
                    color="#FFFFFF"
                  />
                </Pressable>
              )}

              {isRecording ? (
                <Text className="text-lg font-semibold text-brand dark:text-brand-dark">
                  {formatDuration(recorderState.durationMillis)}
                </Text>
              ) : null}
            </View>
          )}

          {phase !== 'review' ? (
            <Text className="text-center text-xs text-subtle dark:text-subtle-dark">
              {autoSendVoice
                ? 'El audio se enviará automáticamente al detener la grabación.'
                : 'Podrás escuchar tu audio antes de enviarlo.'}
            </Text>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
