'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, hashPassword, setSession } from '@/lib/auth';
import {
  getMemberRank,
  renameMember,
  updateMemberPassword,
  updateMemberRank,
  loadApprovedMembers,
  isAdminMember,
} from '@/lib/memberStorage';
import { loadSchedules } from '@/lib/scheduleStorage';
import ScheduleUpload from '@/components/ScheduleUpload';
import ScheduleGrass from '@/components/ScheduleGrass';
import { MonthlySchedule } from '@/types/schedule';

export default function ProfilePage() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [rankInput, setRankInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [schedules, setSchedules] = useState<MonthlySchedule[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) { router.replace('/'); return; }
    const name = session.name;
    setUserName(name);
    setNameInput(name);
    setIsAdmin(isAdminMember(name));
    getMemberRank(name).then(rank => setRankInput(rank ?? ''));
    loadSchedules().then(setSchedules);
  }, [router]);

  const refreshSchedules = () => loadSchedules().then(setSchedules);

  const handleSave = async () => {
    const newName = nameInput.trim();
    if (!newName) { setError('이름을 입력하세요.'); return; }

    const members = await loadApprovedMembers();
    if (newName !== userName && members.find(m => m.name === newName)) {
      setError('이미 사용 중인 이름입니다.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    if (passwordInput.trim()) {
      const hash = await hashPassword(passwordInput.trim());
      await updateMemberPassword(userName, hash);
    }

    await updateMemberRank(userName, rankInput.trim() || null);

    if (newName !== userName) {
      await renameMember(userName, newName);
      setSession({ name: newName });
      setUserName(newName);
    }

    setPasswordInput('');
    setSaving(false);
    setSuccess('저장되었습니다.');
    setTimeout(() => setSuccess(''), 2000);
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
        <h1 className="text-base font-bold text-zinc-900">내 프로필</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* 프로필 정보 */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="font-semibold text-zinc-900">프로필 정보</h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-zinc-500 mb-1">이름</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => { setNameInput(e.target.value); setError(''); }}
                  className="w-full text-sm text-zinc-900 px-3 py-1.5 border border-zinc-200 rounded-lg outline-none focus:border-blue-500 bg-white placeholder:text-zinc-400"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-zinc-500 mb-1">직급</label>
                <input
                  type="text"
                  value={rankInput}
                  onChange={e => { setRankInput(e.target.value); setError(''); }}
                  placeholder="직급 (선택)"
                  className="w-full text-sm text-zinc-900 px-3 py-1.5 border border-zinc-200 rounded-lg outline-none focus:border-blue-500 bg-white placeholder:text-zinc-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">새 비밀번호 (비워두면 유지)</label>
              <input
                type="password"
                value={passwordInput}
                onChange={e => { setPasswordInput(e.target.value); setError(''); }}
                placeholder="변경할 경우만 입력"
                className="w-full text-sm text-zinc-900 px-3 py-1.5 border border-zinc-200 rounded-lg outline-none focus:border-blue-500 bg-white placeholder:text-zinc-400"
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            {success && <p className="text-xs text-blue-600">{success}</p>}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 px-4 py-1.5 rounded-lg transition-colors"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>

        {/* 스케줄 관리 */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="font-semibold text-zinc-900">스케줄</h2>
            <ScheduleUpload
              userName={userName}
              onSuccess={refreshSchedules}
            />
          </div>
          <ScheduleGrass schedules={schedules} userName={userName} />
        </div>

      </div>
    </div>
  );
}
