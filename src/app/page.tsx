'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { SharedItem } from '@/types/work';
import { ShiftType } from '@/types/schedule';
import { Session } from '@/types/auth';
import { getSession, clearSession } from '@/lib/auth';
import {
  loadTemplates, saveTemplate,
  loadCheckedIds, saveCheckedIds,
  Templates, CheckedIds,
} from '@/lib/checklistStorage';
import { ShiftTab } from '@/types/work';
import { getShift } from '@/lib/scheduleStorage';
import { isAdminMember, getMemberRank } from '@/lib/memberStorage';
import { getSharedItemsForDate, addSharedItem, toggleSharedItem, removeSharedItem } from '@/lib/sharedStorage';
import LoginPage from '@/components/LoginPage';
import ChecklistSection from '@/components/ChecklistSection';
import SharedSection from '@/components/SharedSection';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function shiftDate(date: string, n: number) {
  const [y, m, d] = date.split('-').map(Number);
  const result = new Date(Date.UTC(y, m - 1, d + n));
  return result.toISOString().slice(0, 10);
}

function formatDate(date: string) {
  const d = new Date(date + 'T00:00:00');
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}


const SHIFT_LABEL: Record<ShiftType, string> = { A: '주간', B: '석간', C: '야간', '휴': '휴무', '연차': '연차' };
const SHIFT_COLOR: Record<ShiftType, string> = {
  A: 'bg-blue-100 text-blue-700',
  B: 'bg-orange-100 text-orange-700',
  C: 'bg-purple-100 text-purple-700',
  '휴': 'bg-zinc-100 text-zinc-500',
  '연차': 'bg-red-100 text-red-600',
};

function ShiftBadge({ shift }: { shift: ShiftType }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SHIFT_COLOR[shift]}`}>
      {shift} {SHIFT_LABEL[shift]}
    </span>
  );
}

function HeaderMenu({ session }: { session: Session }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
          <circle cx="8" cy="2.5" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="8" cy="13.5" r="1.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-zinc-200 rounded-xl shadow-lg py-1 z-50">
          {isAdminMember(session.name) && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              멤버 관리
            </Link>
          )}
          <button
            onClick={() => { clearSession(); location.reload(); }}
            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}

function AppContent({ session }: { session: Session }) {
  const [date, setDate] = useState(todayStr());
  const [templates, setTemplates] = useState<Templates>({ A: [], B: [], C: [] });
  const [checkedIds, setCheckedIds] = useState<CheckedIds>({ A: [], B: [], C: [] });
  const [shift, setShift] = useState<ShiftType | null>(null);
  const [rank, setRank] = useState<string | null>(null);
  const [handoverItems, setHandoverItems] = useState<SharedItem[]>([]);
  const [specialNoteItems, setSpecialNoteItems] = useState<SharedItem[]>([]);

  useEffect(() => {
    getMemberRank(session.name).then(setRank);
    loadTemplates(session.name).then(setTemplates);
  }, [session.name]);

  const refreshShared = useCallback(async (d: string) => {
    const [handover, special] = await Promise.all([
      getSharedItemsForDate(d, 'handover'),
      getSharedItemsForDate(d, 'specialNote'),
    ]);
    setHandoverItems(handover);
    setSpecialNoteItems(special);
  }, []);

  useEffect(() => {
    loadCheckedIds(session.name, date).then(setCheckedIds);
    getShift(session.name, date).then(setShift);
    refreshShared(date);
  }, [date, session.name, refreshShared]);

  const checklists = {
    A: templates.A.map(i => ({ ...i, checked: checkedIds.A.includes(i.id) })),
    B: templates.B.map(i => ({ ...i, checked: checkedIds.B.includes(i.id) })),
    C: templates.C.map(i => ({ ...i, checked: checkedIds.C.includes(i.id) })),
  };

  const handleToggle = useCallback(async (tab: ShiftTab, id: string) => {
    const cur = checkedIds[tab];
    const next = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id];
    setCheckedIds(prev => ({ ...prev, [tab]: next }));
    await saveCheckedIds(session.name, date, tab, next);
  }, [checkedIds, session.name, date]);

  const handleAdd = useCallback(async (tab: ShiftTab, text: string) => {
    const next = [...templates[tab], { id: crypto.randomUUID(), text }];
    setTemplates(prev => ({ ...prev, [tab]: next }));
    await saveTemplate(session.name, tab, next);
  }, [templates, session.name]);

  const handleRemove = useCallback(async (tab: ShiftTab, id: string) => {
    const next = templates[tab].filter(i => i.id !== id);
    setTemplates(prev => ({ ...prev, [tab]: next }));
    await saveTemplate(session.name, tab, next);
  }, [templates, session.name]);

  const isToday = date === todayStr();

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-base font-bold text-zinc-900">업무 비서</h1>
        <div className="flex items-center gap-2">
          <Link href="/profile" className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
            <span className="text-sm text-zinc-700 font-medium">{session.name}</span>
            {rank && (
              <span className="text-xs text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">{rank}</span>
            )}
          </Link>
          <HeaderMenu session={session} />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setDate(d => shiftDate(d, -1))}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-zinc-200 text-zinc-600 transition-colors"
          >
            ‹
          </button>

          <div className="flex flex-col items-center gap-1.5">
            <span className="text-base font-semibold text-zinc-900">{formatDate(date)}</span>
            <div className="flex items-center gap-2">
              {shift && <ShiftBadge shift={shift} />}
              {!isToday && (
                <button
                  onClick={() => setDate(todayStr())}
                  className="text-xs text-blue-600 hover:underline"
                >
                  오늘로 이동
                </button>
              )}
            </div>
          </div>

          <button
            onClick={() => setDate(d => shiftDate(d, 1))}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-zinc-200 text-zinc-600 transition-colors"
          >
            ›
          </button>
        </div>

        <ChecklistSection
          checklists={checklists}
          onToggle={handleToggle}
          onAdd={handleAdd}
          onRemove={handleRemove}
        />

        <SharedSection
          title="인수인계"
          items={handoverItems}
          currentDate={date}
          userName={session.name}
          extendedForm
          onAdd={async ({ text, description }) => { await addSharedItem('handover', text, session.name, date, { description }); refreshShared(date); }}
          onToggle={async id => { await toggleSharedItem(id); refreshShared(date); }}
          onRemove={async id => { await removeSharedItem(id); refreshShared(date); }}
        />
        <SharedSection
          title="특이사항"
          items={specialNoteItems}
          currentDate={date}
          userName={session.name}
          onAdd={async ({ text }) => { await addSharedItem('specialNote', text, session.name, date); refreshShared(date); }}
          onToggle={async id => { await toggleSharedItem(id); refreshShared(date); }}
          onRemove={async id => { await removeSharedItem(id); refreshShared(date); }}
        />
      </div>
    </div>
  );
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(getSession());
    setReady(true);
  }, []);

  if (!ready) return null;

  if (!session) {
    return <LoginPage onLogin={name => setSession({ name })} />;
  }

  return <AppContent session={session} />;
}
