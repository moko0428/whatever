'use client';

import { useState } from 'react';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function LockerPage() {
  const [department, setDepartment] = useState('');
  const [name, setName] = useState('');
  const [lockerNumber, setLockerNumber] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const canSubmit = department.trim() && name.trim() && lockerNumber.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/locker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: department.trim(),
          name: name.trim(),
          lockerNumber: lockerNumber.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || '오류가 발생했습니다.');
        setStatus('error');
        return;
      }

      setStatus('success');
      setDepartment('');
      setName('');
      setLockerNumber('');
    } catch {
      setErrorMsg('네트워크 오류가 발생했습니다.');
      setStatus('error');
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold text-zinc-900">사물함 현황판</h1>
          <p className="mt-1 text-sm text-zinc-500">
            부서와 성함, 사물함 번호를 입력해주세요.
          </p>
        </div>

        {status === 'success' ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 text-center shadow-sm">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-zinc-900">등록 완료</p>
            <button
              onClick={() => setStatus('idle')}
              className="mt-4 w-full py-2.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              다시 입력하기
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-600">부서</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="예: 총무팀"
                className="w-full px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-600">성함</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 홍길동"
                className="w-full px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-600">
                사물함 번호
              </label>
              <input
                type="number"
                min="1"
                value={lockerNumber}
                onChange={(e) => setLockerNumber(e.target.value)}
                placeholder="예: 12"
                className="w-full px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            {status === 'error' && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit || status === 'loading'}
              className="w-full py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 rounded-lg transition-colors"
            >
              {status === 'loading' ? '등록 중...' : '등록하기'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
