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

export interface JobRecord {
  id: string;
  [key: string]: unknown;
}

export interface JobResult {
  transcription: string;
  structuredData: StructuredData;
  record: JobRecord;
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
