import type { Priority } from '@/types/assistant';

export type RecordType =
  | 'task'
  | 'reminder'
  | 'meeting'
  | 'expense'
  | 'income'
  | 'note'
  | 'idea';

export type RecordStatus = 'pending' | 'completed';

export type MemoryRecord = {
  id: string;
  type: RecordType;
  title: string;
  description?: string;
  priority?: Priority;
  status?: RecordStatus;
  scheduledAt?: string;
  dueAtIso?: string;
  dueLabel?: string;
  category?: string;
  client?: string;
  project?: string;
  amount?: number;
  currency?: string;
  time?: string;
  location?: string;
  tags?: string[];
  createdAt?: string;
  completedAt?: string;
};
