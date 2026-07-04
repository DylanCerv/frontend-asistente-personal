import {
  createRecord,
  deleteRecord,
  listRecords,
  updateRecord,
} from '@/services/records/records-api';
import type { ApiRecord, CreateRecordPayload, UpdateRecordPayload } from '@/types/record-api';

export async function fetchUserRecords(): Promise<ApiRecord[]> {
  return listRecords({ limit: 100 });
}

export async function createUserRecord(payload: CreateRecordPayload): Promise<ApiRecord> {
  return createRecord(payload);
}

export async function patchUserRecord(
  recordId: string,
  payload: UpdateRecordPayload,
): Promise<ApiRecord> {
  return updateRecord(recordId, payload);
}

export async function removeUserRecord(recordId: string): Promise<void> {
  return deleteRecord(recordId);
}
