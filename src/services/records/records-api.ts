import { apiRequest } from '@/services/api/api-client';
import type { RecordType } from '@/types/record';
import type { ApiRecord, RecordsListResponse, RecordResponse, UpdateRecordPayload } from '@/types/record-api';

type ListRecordsParams = {
  type?: RecordType;
  limit?: number;
  offset?: number;
};

export async function listRecords(params: ListRecordsParams = {}): Promise<ApiRecord[]> {
  const searchParams = new URLSearchParams();
  if (params.type) searchParams.set('type', params.type);
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params.offset !== undefined) searchParams.set('offset', String(params.offset));

  const query = searchParams.toString();
  const path = query ? `/records?${query}` : '/records';

  const response = await apiRequest<RecordsListResponse>(path);
  return response.data ?? [];
}

export async function updateRecord(
  recordId: string,
  payload: UpdateRecordPayload,
): Promise<ApiRecord> {
  const response = await apiRequest<RecordResponse>(`/records/${recordId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response.data;
}
