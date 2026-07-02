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
  const structured = result.structuredData;
  if (structured && typeof structured === 'object' && 'summary' in structured) {
    const summary = structured.summary?.trim();
    if (summary) return summary;
  }

  const titles = result.records
    .map((record) => record.title)
    .filter((title): title is string => Boolean(title?.trim()));

  if (titles.length === 1) {
    return `Listo, registré: ${titles[0]}.`;
  }

  if (titles.length > 1) {
    return `Listo, registré ${titles.length} elementos.`;
  }

  return 'Audio procesado correctamente.';
}
