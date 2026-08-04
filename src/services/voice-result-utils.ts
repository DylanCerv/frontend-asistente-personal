import type { ApiRecord } from '@/types/record-api';
import type { JobResult, StructuredData } from '@/types/audio-job';

export type StructuredDataExtraction = {
  items?: StructuredData[];
  summary?: string | null;
};

export type VoiceJobResult = {
  transcription: string;
  structuredData: StructuredData | StructuredDataExtraction;
  records: ApiRecord[];
  record: ApiRecord | null;
};

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
  const titles = result.records
    .map((record) => record.title)
    .filter((title): title is string => Boolean(title?.trim()));

  if (titles.length === 1) {
    return `Listo, registré: ${titles[0]}.`;
  }

  if (titles.length > 1) {
    return `Listo, registré: ${titles.join(', ')}.`;
  }

  const structured = result.structuredData;
  if (structured && typeof structured === 'object' && 'items' in structured) {
    const itemTitles = (structured.items ?? [])
      .map((item) => item.title)
      .filter((title): title is string => Boolean(title?.trim()));
    if (itemTitles.length === 1) return `Listo, registré: ${itemTitles[0]}.`;
    if (itemTitles.length > 1) return `Listo, registré: ${itemTitles.join(', ')}.`;
  }

  if (structured && typeof structured === 'object' && 'summary' in structured) {
    const summary = structured.summary?.trim();
    // Never surface confirmation questions — activities must be saved, not asked.
    if (summary && !/^\s*¿?\s*quieres\b/i.test(summary) && !/\?\s*$/.test(summary)) {
      return summary;
    }
  }

  return 'No pude crear una actividad con ese audio. Intenta de nuevo.';
}
