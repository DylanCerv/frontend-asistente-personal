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
import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

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

const VOICE_TAGS = ['Tareas', 'Recordatorios', 'Ideas'] as const;

function formatDuration(durationMillis: number) {
  const totalSeconds = Math.max(0, Math.floor(durationMillis / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function AudioQuickAction() {
  const [savedUri, setSavedUri] = useState<string | null>(null);
  const audioRecorder = useAudioRecorder(VOICE_RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(audioRecorder, 250);
  const player = useAudioPlayer(savedUri);
  const playerStatus = useAudioPlayerStatus(player);

  const isRecording = recorderState.isRecording;
  const hasRecording = savedUri !== null && !isRecording;

  useEffect(() => {
    if (!isRecording && recorderState.url) {
      setSavedUri(recorderState.url);
    }
  }, [isRecording, recorderState.url]);

  useEffect(() => {
    if (savedUri) {
      player.replace(savedUri);
    }
  }, [savedUri, player]);

  async function startRecording() {
    const permission = await requestRecordingPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Activa el micrófono para grabar notas de voz.');
      return;
    }

    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
      interruptionMode: 'duckOthers',
    });

    await audioRecorder.prepareToRecordAsync(VOICE_RECORDING_OPTIONS);
    audioRecorder.record();
  }

  async function handleRecordPress() {
    try {
      if (isRecording) {
        await audioRecorder.stop();
        return;
      }

      if (playerStatus.playing) {
        player.pause();
      }

      await startRecording();
    } catch {
      Alert.alert('No se pudo grabar', 'Intenta nuevamente en unos segundos.');
    }
  }

  async function handleRecordAnother() {
    try {
      if (playerStatus.playing) {
        player.pause();
      }

      setSavedUri(null);
      await startRecording();
    } catch {
      Alert.alert('No se pudo grabar', 'Intenta nuevamente en unos segundos.');
    }
  }

  function handlePlayPress() {
    if (!savedUri) return;

    if (playerStatus.playing) {
      player.pause();
      return;
    }

    player.play();
  }

  function handleSendPress() {
    // Placeholder: se conectará al backend del asistente.
  }

  return (
    <View className="gap-5 rounded-[32px] border border-border bg-surface p-6 dark:border-border-dark dark:bg-surface-dark">
      <View className="gap-3">
        <View className="flex-row flex-wrap gap-2">
          {VOICE_TAGS.map((tag) => (
            <View
              key={tag}
              className="rounded-full bg-surface-soft px-3 py-1.5 dark:bg-surface-soft-dark">
              <Text className="text-xs font-semibold text-brand dark:text-brand-dark">#{tag}</Text>
            </View>
          ))}
        </View>

        <View className="gap-1">
          <Text className="text-xl font-bold text-foreground dark:text-foreground-dark">
            Anotar con voz
          </Text>
          <Text className="text-[15px] leading-6 text-subtle dark:text-subtle-dark">
            Acceso rápido para grabar tareas, recordatorios o ideas sin escribir.
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isRecording ? 'Detener grabación' : 'Iniciar grabación'}
        onPress={handleRecordPress}
        className={`min-h-[72px] flex-row items-center justify-center gap-3 rounded-[24px] px-6 ${
          isRecording ? 'bg-danger dark:bg-danger-dark' : 'bg-brand dark:bg-brand-dark'
        } active:opacity-85`}>
        <Ionicons
          name={isRecording ? 'stop-circle-outline' : 'mic'}
          size={28}
          color="#FFFFFF"
        />
        <Text className="text-lg font-bold text-white">
          {isRecording ? `Detener ${formatDuration(recorderState.durationMillis)}` : 'Grabar'}
        </Text>
      </Pressable>

      {hasRecording ? (
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
                {playerStatus.duration > 0
                  ? `Duración ${formatDuration(playerStatus.duration * 1000)}`
                  : 'Toca escuchar para reproducir'}
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
              onPress={handleSendPress}
              className="h-[52px] w-[52px] items-center justify-center rounded-2xl bg-brand active:opacity-85 dark:bg-brand-dark">
              <Ionicons name="paper-plane-outline" size={22} color="#FFFFFF" />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Grabar otro audio"
              onPress={handleRecordAnother}
              className="h-[52px] w-[52px] items-center justify-center rounded-2xl border border-border bg-surface active:opacity-80 dark:border-border-dark dark:bg-surface-dark">
              <Ionicons name="mic-outline" size={22} color="#7C3AED" />
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}
