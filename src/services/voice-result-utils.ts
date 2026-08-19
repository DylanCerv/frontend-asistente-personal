import type { ApiRecord } from '@/types/record-api';
import type { CaptureStructuredData, JobResult, StructuredData } from '@/types/audio-job';

export type StructuredDataExtraction = CaptureStructuredData & {
  items?: StructuredData[];
  summary?: string | null;
};

export type VoiceJobResult = {
  transcription: string;
  structuredData: StructuredData | StructuredDataExtraction;
  records: ApiRecord[];
  record: ApiRecord | null;
};

function isCapturePayload(
  value: StructuredData | StructuredDataExtraction | null | undefined,
): value is StructuredDataExtraction {
  return Boolean(value && typeof value === 'object' && ('action' in value || 'items' in value || 'summary' in value));
}

export function normalizeVoiceJobResult(result: JobResult): VoiceJobResult {
  const records =
    (Array.isArray((result as VoiceJobResult).records)
      ? (result as VoiceJobResult).records
      : result.record
        ? [result.record as unknown as ApiRecord]
        : []) ?? [];

  return {
    transcription: result.transcription,
    structuredData: result.structuredData as StructuredData | StructuredDataExtraction,
    records,
    record: records[0] ?? null,
  };
}

export function buildVoiceAssistantReply(result: VoiceJobResult): string {
  const structured = isCapturePayload(result.structuredData) ? result.structuredData : null;

  if (structured?.action === 'ask' || structured?.needsConfirmation) {
    return (
      structured.question?.trim() ||
      structured.summary?.trim() ||
      '¿Esto a qué proyecto o tarea lo vinculo?'
    );
  }

  if (structured?.action === 'complete') {
    return structured.summary?.trim() || 'Listo, la marqué como hecha.';
  }

  const titles = result.records
    .map((record) => record.title)
    .filter((title): title is string => Boolean(title?.trim()));

  if (titles.length === 1) {
    return structured?.summary?.trim() || `Listo, registré: ${titles[0]}.`;
  }

  if (titles.length > 1) {
    return structured?.summary?.trim() || `Listo, registré: ${titles.join(', ')}.`;
  }

  if (structured?.summary?.trim()) {
    return structured.summary.trim();
  }

  if (structured?.items?.length) {
    const itemTitles = structured.items
      .map((item) => item.title)
      .filter((title): title is string => Boolean(title?.trim()));
    if (itemTitles.length === 1) return `Listo, registré: ${itemTitles[0]}.`;
    if (itemTitles.length > 1) return `Listo, registré: ${itemTitles.join(', ')}.`;
  }

  return 'No pude crear una actividad con ese audio. Intenta de nuevo.';
}
