import { supabase } from './supabase';
import { ShiftTab } from '@/types/work';

export type TemplateItem = { id: string; text: string; archiveId?: string };
export type Templates = { [K in ShiftTab]: TemplateItem[] };
export type CheckedIds = { [K in ShiftTab]: string[] };

const SHIFTS: ShiftTab[] = ['A', 'B', 'C'];

export async function loadTemplates(memberName: string): Promise<Templates> {
  const { data } = await supabase
    .from('checklist_templates')
    .select('shift, items')
    .eq('member_name', memberName);

  const result: Templates = { A: [], B: [], C: [] };
  for (const row of data ?? []) {
    if (SHIFTS.includes(row.shift as ShiftTab)) {
      result[row.shift as ShiftTab] = row.items as TemplateItem[];
    }
  }
  return result;
}

export async function saveTemplate(memberName: string, shift: ShiftTab, items: TemplateItem[]): Promise<void> {
  const { error } = await supabase.from('checklist_templates').upsert({ member_name: memberName, shift, items });
  if (error) console.error('saveTemplate error:', error.message, error.code);
}

export async function loadCheckedIds(memberName: string, date: string): Promise<CheckedIds> {
  const { data } = await supabase
    .from('checklist_checks')
    .select('shift, checked_ids')
    .eq('member_name', memberName)
    .eq('date', date);

  const result: CheckedIds = { A: [], B: [], C: [] };
  for (const row of data ?? []) {
    if (SHIFTS.includes(row.shift as ShiftTab)) {
      result[row.shift as ShiftTab] = row.checked_ids as string[];
    }
  }
  return result;
}

export async function saveCheckedIds(memberName: string, date: string, shift: ShiftTab, checkedIds: string[]): Promise<void> {
  const { error } = await supabase.from('checklist_checks').upsert({ member_name: memberName, date, shift, checked_ids: checkedIds });
  if (error) console.error('saveCheckedIds error:', error.message, error.code);
}
