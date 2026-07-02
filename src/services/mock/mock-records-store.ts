import AsyncStorage from '@react-native-async-storage/async-storage';

import { buildSeedApiRecords } from '@/services/mock/mock-record-seed';
import type { ApiRecord, UpdateRecordPayload } from '@/types/record-api';

const STORAGE_PREFIX = '@asistente/mock_records/';

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

export async function loadMockRecords(userId: string): Promise<ApiRecord[]> {
  const raw = await AsyncStorage.getItem(storageKey(userId));
  if (!raw) {
    const seed = buildSeedApiRecords();
    await saveMockRecords(userId, seed);
    return seed;
  }

  try {
    const parsed = JSON.parse(raw) as ApiRecord[];
    return Array.isArray(parsed) ? parsed : buildSeedApiRecords();
  } catch {
    const seed = buildSeedApiRecords();
    await saveMockRecords(userId, seed);
    return seed;
  }
}

export async function saveMockRecords(userId: string, records: ApiRecord[]): Promise<void> {
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(records));
}

export async function updateMockRecord(
  userId: string,
  recordId: string,
  payload: UpdateRecordPayload,
): Promise<ApiRecord> {
  const records = await loadMockRecords(userId);
  const index = records.findIndex((record) => record.id === recordId);

  if (index === -1) {
    throw new Error('Record not found');
  }

  const current = records[index];
  const updated: ApiRecord = {
    ...current,
    type: payload.type ?? current.type,
    title: payload.title ?? current.title,
    description: payload.description ?? current.description,
    priority: payload.priority ?? current.priority,
    date: payload.date ?? current.date,
    client: payload.client ?? current.client,
    project: payload.project ?? current.project,
    amount: payload.amount ?? current.amount,
    currency: payload.currency ?? current.currency,
    data: payload.data ? { ...current.data, ...payload.data } : current.data,
    updated_at: new Date().toISOString(),
  };

  const next = [...records];
  next[index] = updated;
  await saveMockRecords(userId, next);
  return updated;
}

export async function addMockRecords(userId: string, newRecords: ApiRecord[]): Promise<ApiRecord[]> {
  const records = await loadMockRecords(userId);
  const next = [...newRecords, ...records];
  await saveMockRecords(userId, next);
  return next;
}

export async function resetMockRecords(userId: string): Promise<ApiRecord[]> {
  const seed = buildSeedApiRecords();
  await saveMockRecords(userId, seed);
  return seed;
}
