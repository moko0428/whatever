import { supabase } from './supabase';
import { MonthlySchedule, ShiftType } from '@/types/schedule';

export async function loadSchedules(): Promise<MonthlySchedule[]> {
  const { data } = await supabase.from('schedules').select('member_name, year, month, day, shift');
  if (!data || data.length === 0) return [];

  const map = new Map<string, MonthlySchedule>();
  for (const row of data) {
    const key = `${row.year}-${row.month}`;
    if (!map.has(key)) map.set(key, { year: row.year, month: row.month, data: {} });
    const s = map.get(key)!;
    if (!s.data[row.member_name]) s.data[row.member_name] = {};
    s.data[row.member_name][row.day] = row.shift as ShiftType;
  }

  return [...map.values()].sort((a, b) => b.year - a.year || b.month - a.month);
}

export async function mergeUserSchedule(name: string, schedule: MonthlySchedule): Promise<void> {
  const userDays = schedule.data[name] ?? {};

  await supabase
    .from('schedules')
    .delete()
    .eq('member_name', name)
    .eq('year', schedule.year)
    .eq('month', schedule.month);

  const rows = Object.entries(userDays).map(([day, shift]) => ({
    member_name: name,
    year: schedule.year,
    month: schedule.month,
    day: Number(day),
    shift,
  }));

  if (rows.length > 0) {
    await supabase.from('schedules').insert(rows);
  }
}

export async function getShift(name: string, date: string): Promise<ShiftType | null> {
  const [y, m, d] = date.split('-').map(Number);
  const { data } = await supabase
    .from('schedules')
    .select('shift')
    .eq('member_name', name)
    .eq('year', y)
    .eq('month', m)
    .eq('day', d)
    .maybeSingle();
  return (data?.shift as ShiftType) ?? null;
}
