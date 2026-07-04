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

export type CreateRecordPayload = {
  type: RecordType;
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
  /** Optional note explaining why the record was modified (stored in record_changes) */
  note?: string | null;
};

export type RecordChange = {
  id: string;
  record_id: string;
  user_id: string;
  changed_at: string;
  change_note: string | null;
  previous_data: Record<string, unknown>;
};

export type RecordHistoryResponse = {
  success: boolean;
  data: RecordChange[];
};
