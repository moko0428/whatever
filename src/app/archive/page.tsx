'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { loadArchiveDocs, createArchiveDoc, ArchiveDoc } from '@/lib/archiveStorage';

export default function ArchivePage() {
  const router = useRouter();
  const [docs, setDocs] = useState<ArchiveDoc[]>([]);
  const [userName, setUserName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    const session = getSession();
    if (!session) { router.replace('/'); return; }
    setUserName(session.name);
    loadArchiveDocs().then(setDocs);
  }, [router]);

  const handleCreate = async () => {
    const title = newTitle.trim();
    if (!title) return;
    setCreating(true);
    const id = await createArchiveDoc(title, '', userName);
    if (id) router.push(`/archive/${id}`);
    setCreating(false);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push('/')} className="text-zinc-400 hover:text-zinc-700 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-zinc-900 flex-1">기본 업무 아카이브</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* 새 문서 */}
        <div className="bg-white rounded-xl border border-zinc-200 px-5 py-4 flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleCreate(); }}
            placeholder="새 문서 제목..."
            className="flex-1 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none"
          />
          <button
            onClick={handleCreate}
            disabled={!newTitle.trim() || creating}
            className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 px-4 py-1.5 rounded-lg transition-colors"
          >
            {creating ? '...' : '작성'}
          </button>
        </div>

        {/* 문서 목록 */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          {docs.length === 0 ? (
            <p className="px-5 py-10 text-sm text-zinc-400 text-center">문서가 없습니다</p>
          ) : (
            <ul className="divide-y divide-zinc-50">
              {docs.map(doc => (
                <li key={doc.id}>
                  <button
                    onClick={() => router.push(`/archive/${doc.id}`)}
                    className="w-full flex items-center gap-3 px-5 py-4 hover:bg-zinc-50 transition-colors text-left"
                  >
                    <svg className="w-4 h-4 text-zinc-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-800 truncate">{doc.title}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{doc.author} · {formatDate(doc.updated_at)}</p>
                    </div>
                    <svg className="w-4 h-4 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
