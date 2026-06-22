import { supabase } from './supabase';
import { SharedItem, SharedItemType } from '@/types/work';

export async function getSharedItemsForDate(date: string, type: SharedItemType): Promise<SharedItem[]> {
  const [{ data: today }, { data: past }] = await Promise.all([
    supabase.from('shared_items').select('*').eq('type', type).eq('date', date),
    supabase.from('shared_items').select('*').eq('type', type).lt('date', date).eq('resolved', false),
  ]);
  return [...(past ?? []), ...(today ?? [])].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  ) as SharedItem[];
}

export async function addSharedItem(
  type: SharedItemType,
  text: string,
  author: string,
  date: string,
  opts?: { description?: string },
): Promise<void> {
  const { error } = await supabase.from('shared_items').insert({
    id: crypto.randomUUID(),
    type,
    text,
    author,
    resolved: false,
    date,
    description: opts?.description ?? null,
  });
  if (error) console.error('addSharedItem error:', error.message, error.code);
}

export async function toggleSharedItem(id: string): Promise<void> {
  const { data } = await supabase.from('shared_items').select('resolved').eq('id', id).single();
  if (data) {
    await supabase.from('shared_items').update({ resolved: !data.resolved }).eq('id', id);
  }
}

export async function removeSharedItem(id: string): Promise<void> {
  await supabase.from('shared_items').delete().eq('id', id);
}
