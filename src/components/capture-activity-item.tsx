import { Text, View } from 'react-native';

import {
  APP_ACCENT,
  APP_DANGER,
  APP_SURFACE_SOFT,
  APP_TEXT_MUTED,
} from '@/constants/app-colors';
import type { CaptureJobRow } from '@/services/audio/list-jobs';
import type { CaptureStructuredData } from '@/types/audio-job';
import { getDeviceTimeZone } from '@/utils/timezone';

const TEAL = '#2DD4BF';

type OutcomeTone = 'created' | 'asked' | 'updated' | 'error' | 'pending';

type Outcome = {
  tone: OutcomeTone;
  label: string;
  detail: string;
};

function formatWhen(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleString('es', {
    timeZone: getDeviceTimeZone(),
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function itemTitles(data: CaptureStructuredData | null): string[] {
  return (data?.items || []).map((item) => item.title).filter(Boolean);
}

function describeOutcome(job: CaptureJobRow): Outcome {
  const data = job.structured_data;
  const titles = itemTitles(data);
  const transcription = (job.transcription || '').trim();

  if (job.status === 'failed') {
    return {
      tone: 'error',
      label: 'Falló',
      detail: job.error?.message || 'No pude guardar esa captura.',
    };
  }

  if (job.status === 'pending' || job.status === 'processing') {
    return {
      tone: 'pending',
      label: 'En curso',
      detail: transcription || 'Estoy procesando el audio…',
    };
  }

  if (data?.pending?.cancelled) {
    return {
      tone: 'updated',
      label: 'Cancelé',
      detail: data.summary || 'No guardé esa captura.',
    };
  }

  if (data?.action === 'ask' || data?.needsConfirmation) {
    return {
      tone: 'asked',
      label: 'Te pregunté',
      detail: data.question || data.summary || 'Necesitaba una confirmación antes de guardar.',
    };
  }

  if (data?.action === 'create_project') {
    return {
      tone: 'created',
      label: 'Proyecto',
      detail: data.summary || 'Creé un proyecto.',
    };
  }

  if (data?.action === 'complete') {
    return {
      tone: 'updated',
      label: 'Completé',
      detail: data.summary || (titles[0] ? `Marqué “${titles[0]}” como hecha.` : 'Marqué una tarea como hecha.'),
    };
  }

  if (data?.action === 'update') {
    return {
      tone: 'updated',
      label: 'Actualicé',
      detail: data.summary || (titles[0] ? `Actualicé “${titles[0]}”.` : 'Actualicé una tarea existente.'),
    };
  }

  if (data?.action === 'link') {
    return {
      tone: 'updated',
      label: 'Enlacé',
      detail: data.summary || 'Lo enlacé a una tarea que ya tenías.',
    };
  }

  if (titles.length) {
    return {
      tone: 'created',
      label: titles.length > 1 ? `Creé ${titles.length}` : 'Creé',
      detail: data?.summary || titles.map((title) => `“${title}”`).join(', '),
    };
  }

  return {
    tone: data?.summary ? 'created' : 'updated',
    label: data?.summary ? 'Listo' : 'Captura',
    detail: data?.summary || transcription || 'Captura procesada.',
  };
}

function toneColor(tone: OutcomeTone): string {
  if (tone === 'error') return APP_DANGER;
  if (tone === 'asked') return '#FBBF24';
  if (tone === 'pending') return APP_TEXT_MUTED;
  if (tone === 'updated') return APP_ACCENT;
  return TEAL;
}

function sourceLabel(job: CaptureJobRow): string {
  const source = job.structured_data?.source;
  if (source === 'audio' || job.audio_url) return 'Audio';
  if (source === 'text') return 'Texto';
  return job.audio_url ? 'Audio' : 'Texto';
}

export function CaptureActivityItem({ job }: { job: CaptureJobRow }) {
  const outcome = describeOutcome(job);
  const color = toneColor(outcome.tone);
  const heard = (job.transcription || '').trim();

  return (
    <View className="rounded-xl px-3 py-3" style={{ backgroundColor: APP_SURFACE_SOFT }}>
      <View className="flex-row items-center gap-2">
        <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: `${color}22` }}>
          <Text className="text-[10px] font-bold uppercase" style={{ color }}>
            {outcome.label}
          </Text>
        </View>
        <Text className="text-[10px] font-medium" style={{ color: APP_TEXT_MUTED }}>
          {sourceLabel(job)}
        </Text>
        <Text className="ml-auto text-[10px]" style={{ color: APP_TEXT_MUTED }}>
          {formatWhen(job.created_at)}
        </Text>
      </View>
      <Text className="mt-1.5 text-[13px] font-medium leading-5 text-white">{outcome.detail}</Text>
      {heard && heard !== outcome.detail ? (
        <Text className="mt-1 text-xs leading-4" style={{ color: APP_TEXT_MUTED }}>
          Escuché: “{heard}”
        </Text>
      ) : null}
      {job.structured_data?.staleAskIgnored ? (
        <Text className="mt-1 text-[11px]" style={{ color: '#FBBF24' }}>
          Había una pregunta pendiente; la ignoré porque esto era una tarea nueva.
        </Text>
      ) : null}
    </View>
  );
}
