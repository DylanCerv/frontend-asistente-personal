import { isMockDataMode } from '@/config/api';
import { ApiError } from '@/services/api/api-error';
import {
  addMockRecords,
  loadMockRecords,
  updateMockRecord,
} from '@/services/mock/mock-records-store';
import { createApiRecordFromMemory } from '@/services/mock/mock-record-seed';
import { listRecords, updateRecord } from '@/services/records/records-api';
import type { ApiRecord, UpdateRecordPayload } from '@/types/record-api';
import type { MemoryRecord } from '@/types/record';

export type RecordsDataSource = 'api' | 'mock';

export async function fetchUserRecords(userId: string): Promise<{
  records: ApiRecord[];
  source: RecordsDataSource;
}> {
  if (isMockDataMode()) {
    const records = await loadMockRecords(userId);
    return { records, source: 'mock' };
  }

  try {
    const records = await listRecords({ limit: 100 });
    return { records, source: 'api' };
  } catch (error) {
    if (shouldFallbackToMock(error)) {
      const records = await loadMockRecords(userId);
      return { records, source: 'mock' };
    }
    throw error;
  }
}

export async function patchUserRecord(
  userId: string,
  recordId: string,
  payload: UpdateRecordPayload,
  source: RecordsDataSource,
): Promise<ApiRecord> {
  if (source === 'mock' || isMockDataMode()) {
    return updateMockRecord(userId, recordId, payload);
  }

  try {
    return await updateRecord(recordId, payload);
  } catch (error) {
    if (shouldFallbackToMock(error)) {
      return updateMockRecord(userId, recordId, payload);
    }
    throw error;
  }
}

export async function appendMockMemoryRecords(
  userId: string,
  memoryRecords: MemoryRecord[],
): Promise<ApiRecord[]> {
  const apiRecords = memoryRecords.map((record) => createApiRecordFromMemory(record, userId));
  return addMockRecords(userId, apiRecords);
}

function shouldFallbackToMock(error: unknown): boolean {
  if (error instanceof ApiError) {
    if (error.status === 401) return false;
    return error.status === undefined || error.status >= 500 || error.status === 404;
  }
  if (error instanceof TypeError) return true;
  if (error instanceof Error) {
    return /network|fetch|failed|timeout/i.test(error.message);
  }
  return false;
}
