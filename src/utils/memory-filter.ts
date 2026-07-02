import type { MemoryRecord } from '@/types/record';

export type MemoryTypeFilter = 'all' | MemoryRecord['type'];

export function filterMemoryRecords(
  records: MemoryRecord[],
  query: string,
  typeFilter: MemoryTypeFilter = 'all',
): MemoryRecord[] {
  const trimmed = query.trim().toLowerCase();

  return records.filter((record) => {
    if (typeFilter !== 'all' && record.type !== typeFilter) return false;
    if (!trimmed) return true;

    const haystack = [
      record.title,
      record.description,
      record.category,
      record.client,
      record.project,
      record.type,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(trimmed);
  });
}
