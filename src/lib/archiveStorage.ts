import { supabase } from './supabase';

export type ArchiveDoc = {
  id: string;
  title: string;
  content: string;
  author: string;
  created_at: string;
  updated_at: string;
};

export async function loadArchiveDocs(): Promise<ArchiveDoc[]> {
  const { data } = await supabase.from('archive_docs').select('*').order('updated_at', { ascending: false });
  return (data ?? []) as ArchiveDoc[];
}

export async function getArchiveDoc(id: string): Promise<ArchiveDoc | null> {
  const { data } = await supabase.from('archive_docs').select('*').eq('id', id).maybeSingle();
  return data as ArchiveDoc | null;
}

export async function createArchiveDoc(title: string, content: string, author: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('archive_docs')
    .insert({ title, content, author })
    .select('id')
    .single();
  if (error) { console.error('createArchiveDoc error:', error.message); return null; }
  return data?.id ?? null;
}

export async function updateArchiveDoc(id: string, title: string, content: string): Promise<void> {
  await supabase
    .from('archive_docs')
    .update({ title, content, updated_at: new Date().toISOString() })
    .eq('id', id);
}

export async function deleteArchiveDoc(id: string): Promise<void> {
  await supabase.from('archive_docs').delete().eq('id', id);
}

export async function uploadArchiveImage(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop() ?? 'png';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('archive-images').upload(path, file, { upsert: false });
  if (error) { console.error('uploadArchiveImage error:', error.message); return null; }
  const { data } = supabase.storage.from('archive-images').getPublicUrl(path);
  return data.publicUrl;
}
