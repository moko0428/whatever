import { supabase } from './supabase';

export type ApprovedMember = {
  name: string;
  passwordHash: string | null;
  rank: string | null;
};

const ADMIN_SUFFIX = process.env.NEXT_PUBLIC_ADMIN_SUFFIX ?? '관리자';

export function isAdminMember(name: string): boolean {
  return name.endsWith(ADMIN_SUFFIX);
}

export async function loadApprovedMembers(): Promise<ApprovedMember[]> {
  const { data } = await supabase
    .from('members')
    .select('name, password_hash, rank')
    .order('created_at');
  return (data ?? []).map(m => ({ name: m.name, passwordHash: m.password_hash, rank: m.rank }));
}

export async function isApproved(name: string): Promise<boolean> {
  if (isAdminMember(name)) return true;
  const { data } = await supabase.from('members').select('name').eq('name', name).maybeSingle();
  return !!data;
}

export async function getMemberPasswordHash(name: string): Promise<string | null> {
  const { data } = await supabase.from('members').select('password_hash').eq('name', name).maybeSingle();
  return data?.password_hash ?? null;
}

export async function getMemberRank(name: string): Promise<string | null> {
  const { data } = await supabase.from('members').select('rank').eq('name', name).maybeSingle();
  return data?.rank ?? null;
}

export async function addApprovedMember(
  name: string,
  passwordHash: string | null,
  rank: string | null,
): Promise<void> {
  const { error } = await supabase.from('members').upsert({ name, password_hash: passwordHash, rank });
  if (error) console.error('addApprovedMember error:', error.message, error.code);
}

export async function updateMemberPassword(name: string, passwordHash: string | null): Promise<void> {
  await supabase.from('members').update({ password_hash: passwordHash }).eq('name', name);
}

export async function updateMemberRank(name: string, rank: string | null): Promise<void> {
  await supabase.from('members').update({ rank }).eq('name', name);
}

export async function renameMember(oldName: string, newName: string): Promise<void> {
  await supabase.from('members').update({ name: newName }).eq('name', oldName);
  await supabase.from('schedules').update({ member_name: newName }).eq('member_name', oldName);
}

export async function removeApprovedMember(name: string): Promise<void> {
  if (isAdminMember(name)) return;
  await supabase.from('members').delete().eq('name', name);
}
