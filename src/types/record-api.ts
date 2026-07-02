import type { RecordType } from '@/types/record';

export type ApiRecord = {
  id: string;
  user_id: string;
  job_id: string | null;
  type: RecordType;
  title: string | null;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | null;
  date: string | null;
  client: string | null;
  project: string | null;
  amount: number | null;
  currency: string | null;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type RecordsListResponse = {
  success: boolean;
  data: ApiRecord[];
  count: number;
};

export type RecordResponse = {
  success: boolean;
  data: ApiRecord;
};

export type UpdateRecordPayload = {
  type?: RecordType;
  title?: string | null;
  description?: string | null;
  priority?: 'low' | 'medium' | 'high' | null;
  date?: string | null;
  client?: string | null;
  project?: string | null;
  amount?: number | null;
  currency?: string | null;
  data?: Record<string, unknown>;
};
