'use client';

import { useState, useEffect } from 'react';
import { hashPassword, setSession } from '@/lib/auth';
import { isAdminMember, getMemberPasswordHash, addApprovedMember, isApproved, loadApprovedMembers } from '@/lib/memberStorage';

type Props = {
  onLogin: (name: string) => void;
};

export default function LoginPage({ onLogin }: Props) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [memberNames, setMemberNames] = useState<string[]>([]);

  useEffect(() => {
    loadApprovedMembers().then(members => setMemberNames(members.map(m => m.name)));
  }, []);

  const trimmedName = name.trim();
  const isAdmin = isAdminMember(trimmedName);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!trimmedName || !password) return;

    setLoading(true);
    setError('');

    try {
      const approved = await isApproved(trimmedName);
      if (!approved) {
        setError('승인되지 않은 사용자입니다.');
        return;
      }

      const hash = await hashPassword(password);
      const existingHash = await getMemberPasswordHash(trimmedName);

      if (!existingHash) {
        if (!isAdmin) {
          setError('비밀번호가 설정되지 않았습니다. 관리자에게 요청하세요.');
          return;
        }
        await addApprovedMember(trimmedName, hash, null);
      } else if (existingHash !== hash) {
        setError('비밀번호가 올바르지 않습니다.');
        return;
      }

      setSession({ name: trimmedName });
      onLogin(trimmedName);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-zinc-900">업무 비서</h1>
          <p className="text-sm text-zinc-500 mt-1">로그인하여 시작하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">이름</label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              placeholder="이름을 입력하세요"
              className="w-full px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              list="approved-names"
              autoFocus
            />
            <datalist id="approved-names">
              {memberNames.map(n => <option key={n} value={n} />)}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder={isAdmin ? '처음 로그인 시 비밀번호를 설정합니다' : '비밀번호를 입력하세요'}
              className="w-full px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={!trimmedName || !password || loading}
            className="w-full py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 rounded-lg transition-colors"
          >
            {loading ? '처리 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}
