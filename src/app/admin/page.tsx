'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, hashPassword, setSession } from '@/lib/auth';
import {
  isAdminMember,
  loadApprovedMembers,
  addApprovedMember,
  updateMemberPassword,
  updateMemberRank,
  renameMember,
  removeApprovedMember,
  ApprovedMember,
} from '@/lib/memberStorage';

type EditState = { password: string; rank: string };

export default function AdminPage() {
  const router = useRouter();
  const [members, setMembers] = useState<ApprovedMember[]>([]);

  const [myName, setMyName] = useState('');
  const [myRank, setMyRank] = useState('');
  const [myPassword, setMyPassword] = useState('');
  const [myError, setMyError] = useState('');
  const [mySaving, setMySaving] = useState(false);

  const [nameInput, setNameInput] = useState('');
  const [rankInput, setRankInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [addError, setAddError] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ password: '', rank: '' });
  const [saving, setSaving] = useState(false);

  const refresh = async () => setMembers(await loadApprovedMembers());

  useEffect(() => {
    const session = getSession();
    if (!session || !isAdminMember(session.name)) {
      router.replace('/');
      return;
    }
    setMyName(session.name);
    loadApprovedMembers().then(all => {
      setMembers(all);
      const me = all.find(m => m.name === session.name);
      setMyRank(me?.rank ?? '');
    });
  }, [router]);

  const handleSaveMy = async () => {
    const newName = myName.trim();
    if (!newName) { setMyError('이름을 입력하세요.'); return; }
    const currentName = getSession()?.name ?? '';
    if (newName !== currentName && members.find(m => m.name === newName)) {
      setMyError('이미 사용 중인 이름입니다.');
      return;
    }
    setMySaving(true);
    setMyError('');

    if (myPassword.trim()) {
      const hash = await hashPassword(myPassword.trim());
      await updateMemberPassword(currentName, hash);
    }
    await updateMemberRank(currentName, myRank.trim() || null);
    if (newName !== currentName) {
      await renameMember(currentName, newName);
      setSession({ name: newName });
    }

    setMyPassword('');
    await refresh();
    setMySaving(false);
  };

  const handleAdd = async () => {
    const name = nameInput.trim();
    const pw = passwordInput.trim();
    const rank = rankInput.trim() || null;
    if (!name || !pw) return;
    if (members.find(m => m.name === name)) {
      setAddError('이미 추가된 멤버입니다.');
      return;
    }
    setSaving(true);
    const hash = await hashPassword(pw);
    await addApprovedMember(name, hash, rank);
    await refresh();
    setNameInput('');
    setRankInput('');
    setPasswordInput('');
    setAddError('');
    setSaving(false);
  };

  const handleRemove = async (name: string) => {
    await removeApprovedMember(name);
    await refresh();
    if (editing === name) setEditing(null);
  };

  const openEdit = (member: ApprovedMember) => {
    setEditing(member.name);
    setEditState({ password: '', rank: member.rank ?? '' });
  };

  const handleSaveEdit = async (name: string) => {
    setSaving(true);
    if (editState.password.trim()) {
      const hash = await hashPassword(editState.password.trim());
      await updateMemberPassword(name, hash);
    }
    await updateMemberRank(name, editState.rank.trim() || null);
    await refresh();
    setEditing(null);
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.push('/')}
          className="text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-zinc-900">멤버 관리</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* 내 정보 */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="font-semibold text-zinc-900">내 정보</h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-zinc-500 mb-1">이름</label>
                <input
                  type="text"
                  value={myName}
                  onChange={e => { setMyName(e.target.value); setMyError(''); }}
                  className="w-full text-sm text-zinc-900 px-3 py-1.5 border border-zinc-200 rounded-lg outline-none focus:border-blue-500 bg-white placeholder:text-zinc-400"
                  placeholder="이름"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-zinc-500 mb-1">직급</label>
                <input
                  type="text"
                  value={myRank}
                  onChange={e => { setMyRank(e.target.value); setMyError(''); }}
                  className="w-full text-sm text-zinc-900 px-3 py-1.5 border border-zinc-200 rounded-lg outline-none focus:border-blue-500 bg-white placeholder:text-zinc-400"
                  placeholder="직급 (선택)"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">새 비밀번호 (비워두면 유지)</label>
              <input
                type="password"
                value={myPassword}
                onChange={e => { setMyPassword(e.target.value); setMyError(''); }}
                className="w-full text-sm text-zinc-900 px-3 py-1.5 border border-zinc-200 rounded-lg outline-none focus:border-blue-500 bg-white placeholder:text-zinc-400"
                placeholder="변경할 경우만 입력"
              />
            </div>
            {myError && <p className="text-xs text-red-500">{myError}</p>}
            <div className="flex justify-end">
              <button
                onClick={handleSaveMy}
                disabled={mySaving}
                className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 px-4 py-1.5 rounded-lg transition-colors"
              >
                {mySaving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
          멤버를 추가할 때 이름, 직급, 비밀번호를 설정합니다. 멤버는 이름과 비밀번호로 로그인할 수 있습니다.
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="font-semibold text-zinc-900">멤버 목록</h2>
            <span className="text-sm text-zinc-400">{members.length}명</span>
          </div>

          <ul className="divide-y divide-zinc-50">
            {members.map(member => (
              <li key={member.name}>
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-sm font-medium text-zinc-600 flex-shrink-0">
                    {member.name[0]}
                  </div>
                  <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-medium text-zinc-800">{member.name}</span>
                    {member.rank && (
                      <span className="text-xs text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">{member.rank}</span>
                    )}
                    {isAdminMember(member.name) && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">관리자</span>
                    )}
                    {!isAdminMember(member.name) && !member.passwordHash && (
                      <span className="text-xs text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">비밀번호 없음</span>
                    )}
                  </div>
                  {!isAdminMember(member.name) && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => editing === member.name ? setEditing(null) : openEdit(member)}
                        className="text-xs text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 px-2 py-1 rounded transition-colors"
                      >
                        편집
                      </button>
                      <button
                        onClick={() => handleRemove(member.name)}
                        className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                      >
                        제거
                      </button>
                    </div>
                  )}
                </div>

                {editing === member.name && (
                  <div className="px-5 pb-4 pt-1 bg-zinc-50 space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs text-zinc-500 mb-1">직급</label>
                        <input
                          type="text"
                          value={editState.rank}
                          onChange={e => setEditState(s => ({ ...s, rank: e.target.value }))}
                          placeholder="예: 팀장, 사원"
                          className="w-full text-sm text-zinc-900 px-3 py-1.5 border border-zinc-200 rounded-lg outline-none focus:border-blue-500 bg-white placeholder:text-zinc-400"
                          autoFocus
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-zinc-500 mb-1">새 비밀번호 (비워두면 유지)</label>
                        <input
                          type="password"
                          value={editState.password}
                          onChange={e => setEditState(s => ({ ...s, password: e.target.value }))}
                          placeholder="변경할 경우만 입력"
                          className="w-full text-sm text-zinc-900 px-3 py-1.5 border border-zinc-200 rounded-lg outline-none focus:border-blue-500 bg-white placeholder:text-zinc-400"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditing(null)}
                        className="text-sm text-zinc-400 hover:text-zinc-600 px-3 py-1 rounded transition-colors"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => handleSaveEdit(member.name)}
                        disabled={saving}
                        className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 px-3 py-1 rounded transition-colors"
                      >
                        저장
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* 멤버 추가 폼 */}
          <div className="px-5 py-4 border-t border-zinc-100 space-y-3">
            <p className="text-xs font-medium text-zinc-500">새 멤버 추가</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={e => { setNameInput(e.target.value); setAddError(''); }}
                placeholder="이름"
                className="flex-1 text-sm text-zinc-900 px-3 py-1.5 border border-zinc-200 rounded-lg outline-none focus:border-blue-500 placeholder:text-zinc-400"
              />
              <input
                type="text"
                value={rankInput}
                onChange={e => setRankInput(e.target.value)}
                placeholder="직급 (선택)"
                className="flex-1 text-sm text-zinc-900 px-3 py-1.5 border border-zinc-200 rounded-lg outline-none focus:border-blue-500 placeholder:text-zinc-400"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={passwordInput}
                onChange={e => { setPasswordInput(e.target.value); setAddError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
                placeholder="비밀번호"
                className="flex-1 text-sm text-zinc-900 px-3 py-1.5 border border-zinc-200 rounded-lg outline-none focus:border-blue-500 placeholder:text-zinc-400"
              />
              <button
                onClick={handleAdd}
                disabled={!nameInput.trim() || !passwordInput.trim() || saving}
                className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 px-4 py-1.5 rounded-lg transition-colors flex-shrink-0"
              >
                {saving ? '...' : '추가'}
              </button>
            </div>
            {addError && <p className="text-xs text-red-500">{addError}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
