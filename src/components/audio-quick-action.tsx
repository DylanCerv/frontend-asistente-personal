import Ionicons from '@react-native-vector-icons/ionicons';
import {
  AudioQuality,
  IOSOutputFormat,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
  type RecordingOptions,
} from 'expo-audio';
import { Alert, Platform, Pressable, Text, View } from 'react-native';

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

function formatDuration(durationMillis: number) {
  const totalSeconds = Math.max(0, Math.floor(durationMillis / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function AudioQuickAction() {
  const audioRecorder = useAudioRecorder(VOICE_RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(audioRecorder, 250);
  const isRecording = recorderState.isRecording;
  const recordingUri = recorderState.url ?? audioRecorder.uri;

  async function handleRecordPress() {
    try {
      if (isRecording) {
        await audioRecorder.stop();
        return;
      }

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
    } catch {
      Alert.alert('No se pudo grabar', 'Intenta nuevamente en unos segundos.');
    }
  }

  return (
    <View className="gap-5 rounded-[32px] border border-border bg-surface p-6 dark:border-border-dark dark:bg-surface-dark">
      <View className="flex-row items-start gap-4">
        <View className="h-16 w-16 items-center justify-center rounded-[24px] bg-muted dark:bg-muted-dark">
          <Ionicons name="mic-outline" size={32} color="#7C3AED" />
        </View>

        <View className="flex-1 gap-1">
          <Text className="text-xl font-bold text-foreground dark:text-foreground-dark">
            Nota de voz rápida
          </Text>
          <Text className="text-[15px] leading-6 text-subtle dark:text-subtle-dark">
            Guarda audio claro en formato {Platform.OS === 'web' ? 'WebM' : 'M4A/AAC'} mono a
            48 kbps para ocupar poco espacio.
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
          name={isRecording ? 'stop-circle-outline' : 'radio-button-on-outline'}
          size={28}
          color="#FFFFFF"
        />
        <Text className="text-lg font-bold text-white">
          {isRecording ? `Detener ${formatDuration(recorderState.durationMillis)}` : 'Grabar audio'}
        </Text>
      </Pressable>

      {recordingUri ? (
        <View className="flex-row items-center gap-2 rounded-2xl bg-surface-soft px-4 py-3 dark:bg-surface-soft-dark">
          <Ionicons name="checkmark-circle-outline" size={18} color="#06B6D4" />
          <Text className="flex-1 text-xs leading-4 text-subtle dark:text-subtle-dark" numberOfLines={1}>
            Último audio guardado: {recordingUri}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
