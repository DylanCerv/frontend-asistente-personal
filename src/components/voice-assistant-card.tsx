import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { useAudioProcessing } from '@/hooks/use-audio-processing';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';
import type { StructuredData } from '@/types/audio-job';

const TYPE_LABELS: Record<StructuredData['type'], string> = {
  task: 'Tarea',
  reminder: 'Recordatorio',
  meeting: 'Reunión',
  expense: 'Gasto',
  income: 'Ingreso',
  note: 'Nota',
  idea: 'Idea',
};

function ResultCard({ data }: { data: StructuredData }) {
  return (
    <View className="gap-2 rounded-xl border border-border bg-canvas p-4 dark:border-border-dark dark:bg-canvas-dark">
      <Text className="text-xs font-semibold uppercase tracking-wide text-brand dark:text-brand-dark">
        {TYPE_LABELS[data.type]}
      </Text>
      <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
        {data.title}
      </Text>
      {data.description ? (
        <Text className="text-sm leading-5 text-subtle dark:text-subtle-dark">{data.description}</Text>
      ) : null}
      {data.date ? (
        <Text className="text-sm text-subtle dark:text-subtle-dark">Fecha: {data.date}</Text>
      ) : null}
      {data.amount != null ? (
        <Text className="text-sm text-subtle dark:text-subtle-dark">
          {data.amount} {data.currency ?? ''}
        </Text>
      ) : null}
    </View>
  );
}

export function VoiceAssistantCard() {
  const recorder = useVoiceRecorder();
  const processing = useAudioProcessing();

  const isBusy = processing.isBusy;

  async function handleToggleRecording() {
    if (recorder.isRecording) {
      await recorder.stopRecording();
      return;
    }

    processing.reset();
    await recorder.startRecording();
  }

  async function handleSendRecording() {
    if (!recorder.uri) return;
    await processing.processRecording(recorder.uri);
    recorder.reset();
  }

  function handleDiscard() {
    processing.cancel();
    processing.reset();
    recorder.reset();
  }

  return (
    <View className="gap-4 rounded-2xl border border-border bg-muted p-6 dark:border-border-dark dark:bg-muted-dark">
      <View className="gap-1">
        <Text className="text-sm font-semibold text-brand dark:text-brand-dark">Asistente de voz</Text>
        <Text className="text-lg font-semibold leading-[26px] text-foreground dark:text-foreground-dark">
          Graba una nota y la procesaré por ti
        </Text>
      </View>

      <View className="flex-row flex-wrap gap-3">
        <Pressable
          accessibilityRole="button"
          disabled={isBusy}
          onPress={handleToggleRecording}
          className={`min-h-[52px] flex-1 items-center justify-center rounded-xl px-4 ${
            recorder.isRecording
              ? 'bg-danger dark:bg-danger-dark'
              : 'bg-brand dark:bg-brand-dark'
          } ${isBusy ? 'opacity-50' : 'active:opacity-85'}`}>
          <Text className="text-base font-semibold text-white">
            {recorder.isRecording ? 'Detener' : 'Grabar'}
          </Text>
        </Pressable>

        {recorder.hasRecording ? (
          <Button
            label="Enviar"
            onPress={handleSendRecording}
            disabled={isBusy}
            className="flex-1"
          />
        ) : null}
      </View>

      {recorder.error ? (
        <Text className="text-sm text-danger dark:text-danger-dark">{recorder.error}</Text>
      ) : null}

      {processing.uiState !== 'idle' ? (
        <View className="gap-3 rounded-xl border border-border bg-canvas p-4 dark:border-border-dark dark:bg-canvas-dark">
          <View className="flex-row items-center gap-3">
            {processing.isBusy ? <ActivityIndicator color="#2563EB" /> : null}
            <Text className="flex-1 text-sm font-medium text-foreground dark:text-foreground-dark">
              {processing.message}
            </Text>
            {processing.uiState === 'processing' ? (
              <Text className="text-sm text-subtle dark:text-subtle-dark">{processing.progress}%</Text>
            ) : null}
          </View>

          {processing.error ? (
            <Text className="text-sm text-danger dark:text-danger-dark">{processing.error}</Text>
          ) : null}

          {processing.result?.structuredData ? (
            <ResultCard data={processing.result.structuredData} />
          ) : null}

          {processing.uiState === 'error' && processing.jobId ? (
            <Button label="Reintentar" variant="secondary" onPress={processing.retry} />
          ) : null}

          {processing.uiState === 'done' || processing.uiState === 'error' ? (
            <Button label="Nueva grabación" variant="ghost" onPress={handleDiscard} />
          ) : null}
        </View>
      ) : (
        <View className="rounded-xl border border-border bg-canvas px-4 py-4 dark:border-border-dark dark:bg-canvas-dark">
          <Text className="text-[15px] text-subtle dark:text-subtle-dark">
            Mantén pulsado Grabar, habla y luego envía el audio.
          </Text>
        </View>
      )}
    </View>
  );
}
