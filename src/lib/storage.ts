import { DayRecord } from '@/types/work';

const KEY = 'work-records';

export function loadRecords(): Record<string, DayRecord> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function saveRecord(record: DayRecord): void {
  const all = loadRecords();
  all[record.date] = record;
  localStorage.setItem(KEY, JSON.stringify(all));
}
