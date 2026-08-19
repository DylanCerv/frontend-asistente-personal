import type { ApiRecord } from '@/types/record-api';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type StructuredDataType =
  | 'task'
  | 'reminder'
  | 'meeting'
  | 'expense'
  | 'income'
  | 'note'
  | 'idea';

export interface StructuredData {
  type: StructuredDataType;
  title: string;
  description?: string | null;
  priority?: 'low' | 'medium' | 'high' | null;
  date?: string | null;
  client?: string | null;
  project?: string | null;
  amount?: number | null;
  currency?: string | null;
}

export type CaptureAction =
  | 'create'
  | 'update'
  | 'link'
  | 'ask'
  | 'create_project'
  | 'complete';

export interface CaptureStructuredData {
  action?: CaptureAction;
  needsConfirmation?: boolean;
  question?: string | null;
  options?: string[];
  summary?: string | null;
  source?: 'audio' | 'text';
  staleAskIgnored?: boolean;
  items?: StructuredData[];
  pending?: {
    originalText?: string;
    expiresAt?: string;
    resolved?: boolean;
    cancelled?: boolean;
  };
  match?: {
    projectName?: string | null;
    relatedTaskId?: string | null;
    relation?: string | null;
    reason?: string | null;
  };
}

export interface JobRecord extends ApiRecord {}

export interface JobResult {
  transcription: string;
  structuredData: StructuredData | CaptureStructuredData;
  records?: ApiRecord[];
  record: JobRecord | null;
}

export interface UploadAudioResponse {
  success: boolean;
  jobId: string;
  status: 'pending';
}

export interface JobPollResponse {
  success: boolean;
  jobId: string;
  status: JobStatus;
  progress: number;
  result?: JobResult;
  error?: {
    message: string;
    occurredAt: string;
  };
}

export type AudioProcessingUiState = 'idle' | 'uploading' | 'processing' | 'done' | 'error';
