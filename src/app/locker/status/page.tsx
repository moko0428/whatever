'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type LoadStatus = 'loading' | 'done' | 'error';

export default function LockerStatusPage() {
  const router = useRouter();
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('loading');
  const [emptyLockers, setEmptyLockers] = useState<number[]>([]);
  const [occupiedCount, setOccupiedCount] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch('/api/locker')
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        setEmptyLockers(data.empty);
        setOccupiedCount(data.occupiedCount);
        setTotal(data.total);
        setLoadStatus('done');
      })
      .catch(() => setLoadStatus('error'));
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
        >
          ‹
        </button>
        <h1 className="text-base font-bold text-zinc-900">빈 사물함 확인</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {loadStatus === 'loading' && (
          <p className="text-sm text-zinc-400 text-center py-12">불러오는 중...</p>
        )}

        {loadStatus === 'error' && (
          <p className="text-sm text-red-500 text-center py-12">데이터를 불러오는데 실패했습니다.</p>
        )}

        {loadStatus === 'done' && (
          <>
            <div className="flex gap-3 mb-4">
              <div className="flex-1 bg-white border border-zinc-200 rounded-xl p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-zinc-900">{emptyLockers.length}</p>
                <p className="text-xs text-zinc-500 mt-0.5">빈 사물함</p>
              </div>
              <div className="flex-1 bg-white border border-zinc-200 rounded-xl p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-zinc-900">{occupiedCount}</p>
                <p className="text-xs text-zinc-500 mt-0.5">사용 중</p>
              </div>
              <div className="flex-1 bg-white border border-zinc-200 rounded-xl p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-zinc-900">{total}</p>
                <p className="text-xs text-zinc-500 mt-0.5">전체</p>
              </div>
            </div>

            {emptyLockers.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-8">빈 사물함이 없습니다.</p>
            ) : (
              <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-medium text-zinc-500 mb-3">빈 사물함 번호</p>
                <div className="flex flex-wrap gap-2">
                  {emptyLockers.map(n => (
                    <span
                      key={n}
                      className="px-2.5 py-1 text-sm font-medium text-zinc-700 bg-zinc-100 rounded-lg"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
