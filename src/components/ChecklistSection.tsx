'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import Link from 'next/link';
import { ChecklistItem, ShiftTab } from '@/types/work';

type Checklists = { [K in ShiftTab]: ChecklistItem[] };
type ArchiveDoc = { id: string; title: string };

type Props = {
  checklists: Checklists;
  archiveDocs: ArchiveDoc[];
  initialTab?: ShiftTab;
  onToggle: (tab: ShiftTab, id: string) => void;
  onAdd: (tab: ShiftTab, text: string, archiveId?: string) => void;
  onRemove: (tab: ShiftTab, id: string) => void;
  onLink: (tab: ShiftTab, itemId: string, archiveId: string | null) => void;
};

const TABS: { key: ShiftTab; label: string }[] = [
  { key: 'A', label: '주간' },
  { key: 'B', label: '석간' },
  { key: 'C', label: '야간' },
];

// 텍스트 내 @docTitle 을 파싱해 인라인 링크로 렌더링
function ItemText({ item, docs, checked }: { item: ChecklistItem; docs: ArchiveDoc[]; checked: boolean }) {
  const baseCls = checked ? 'line-through text-zinc-400' : 'text-zinc-800';

  // 구형 archiveId 방식 (전체 텍스트가 링크)
  if (item.archiveId) {
    return (
      <span className={baseCls}>
        <Link href={`/archive/${item.archiveId}`} className={checked ? 'text-zinc-400 hover:underline' : 'text-blue-600 hover:underline'}>
          {item.text}
        </Link>
      </span>
    );
  }

  // @mention 파싱
  const parts = item.text.split(/(@\S+)/g);
  return (
    <span className={baseCls}>
      {parts.map((part, i) => {
        if (part.startsWith('@')) {
          const title = part.slice(1);
          const doc = docs.find(d => d.title === title);
          if (doc) {
            return (
              <Link key={i} href={`/archive/${doc.id}`} className={checked ? 'text-zinc-400 hover:underline' : 'text-blue-600 hover:underline'}>
                {title}
              </Link>
            );
          }
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

export default function ChecklistSection({ checklists, archiveDocs, initialTab, onToggle, onAdd, onRemove, onLink }: Props) {
  const [tab, setTab] = useState<ShiftTab>(initialTab ?? 'A');

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);
  const [input, setInput] = useState('');
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [citeOpen, setCiteOpen] = useState(false);

  const linkDropdownRef = useRef<HTMLDivElement>(null);
  const mentionRef = useRef<HTMLDivElement>(null);
  const citeRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = checklists[tab];
  const done = items.filter(i => i.checked).length;

  const filteredDocs = archiveDocs.filter(d =>
    d.title.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (linkDropdownRef.current && !linkDropdownRef.current.contains(e.target as Node)) setLinkingId(null);
      if (mentionRef.current && !mentionRef.current.contains(e.target as Node)) setMentionOpen(false);
      if (citeRef.current && !citeRef.current.contains(e.target as Node)) setCiteOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInputChange = (value: string) => {
    setInput(value);
    const atIdx = value.lastIndexOf('@');
    if (atIdx !== -1) {
      // @ 이후 공백이 없을 때만 멘션 모드
      const afterAt = value.slice(atIdx + 1);
      if (!afterAt.includes(' ')) {
        setMentionQuery(afterAt);
        setMentionOpen(true);
        return;
      }
    }
    setMentionOpen(false);
  };

  const selectMention = (doc: ArchiveDoc) => {
    const atIdx = input.lastIndexOf('@');
    const newInput = input.slice(0, atIdx) + '@' + doc.title + ' ';
    setInput(newInput);
    setMentionOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const selectCite = (doc: ArchiveDoc) => {
    setInput(prev => {
      const trimmed = prev.trimEnd();
      return (trimmed ? trimmed + ' ' : '') + '@' + doc.title + ' ';
    });
    setCiteOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleAdd = () => {
    const text = input.trim();
    if (!text) return;
    onAdd(tab, text);
    setInput('');
    setMentionOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { setMentionOpen(false); return; }
    if (mentionOpen && filteredDocs.length > 0 && e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      selectMention(filteredDocs[0]);
      return;
    }
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAdd();
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
        <h2 className="font-semibold text-zinc-900">업무 체크리스트</h2>
        {items.length > 0 && (
          <span className="text-sm text-zinc-400">{done} / {items.length}</span>
        )}
      </div>

      <div className="flex border-b border-zinc-100">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setInput(''); setLinkingId(null); setMentionOpen(false); }}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              tab === t.key ? 'text-blue-600 border-b-2 border-blue-600' : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ul className="divide-y divide-zinc-50 max-h-64 overflow-y-auto">
        {items.length === 0 && (
          <li className="px-5 py-6 text-sm text-zinc-400 text-center">아래에서 항목을 추가하세요</li>
        )}
        {items.map(item => (
          <li key={item.id} className="flex items-center gap-3 px-5 py-3">
            <button
              onClick={() => onToggle(tab, item.id)}
              className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
                item.checked ? 'bg-blue-600 border-blue-600' : 'border-zinc-300 hover:border-blue-400'
              }`}
            >
              {item.checked && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            <span className="flex-1 text-sm">
              <ItemText item={item} docs={archiveDocs} checked={item.checked} />
            </span>

            {/* 링크 버튼 */}
            <div className="relative" ref={linkingId === item.id ? linkDropdownRef : null}>
              <button
                onClick={() => setLinkingId(linkingId === item.id ? null : item.id)}
                className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
                  item.archiveId ? 'text-blue-500 hover:text-blue-700' : 'text-zinc-300 hover:text-zinc-500'
                }`}
                title={item.archiveId ? '링크 변경' : '아카이브 링크'}
              >
                링크
              </button>
              {linkingId === item.id && (
                <div className="absolute right-0 bottom-full mb-1 w-52 bg-white border border-zinc-200 rounded-xl shadow-lg py-1 z-50">
                  {item.archiveId && (
                    <button
                      onClick={() => { onLink(tab, item.id, null); setLinkingId(null); }}
                      className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors"
                    >
                      링크 해제
                    </button>
                  )}
                  {archiveDocs.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-zinc-400">아카이브 문서가 없습니다</p>
                  ) : (
                    archiveDocs.map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => { onLink(tab, item.id, doc.id); setLinkingId(null); }}
                        className={`w-full text-left px-3 py-2 text-xs transition-colors truncate ${
                          item.archiveId === doc.id ? 'text-blue-600 bg-blue-50' : 'text-zinc-700 hover:bg-zinc-50'
                        }`}
                      >
                        {doc.title}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => onRemove(tab, item.id)}
              className="text-zinc-300 hover:text-red-500 transition-colors text-lg leading-none"
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      {/* 입력 영역 */}
      <div className="px-5 py-3 border-t border-zinc-100">
        <div className="relative" ref={mentionRef}>
          {/* @멘션 드롭다운 */}
          {mentionOpen && (
            <div className="absolute bottom-full mb-1 left-0 right-0 bg-white border border-zinc-200 rounded-xl shadow-lg py-1 z-50 max-h-48 overflow-y-auto">
              {filteredDocs.length === 0 ? (
                <p className="px-3 py-2 text-xs text-zinc-400">일치하는 문서 없음</p>
              ) : (
                filteredDocs.map(doc => (
                  <button
                    key={doc.id}
                    onMouseDown={e => { e.preventDefault(); selectMention(doc); }}
                    className="w-full text-left px-3 py-2 text-xs text-zinc-700 hover:bg-blue-50 hover:text-blue-700 transition-colors truncate"
                  >
                    {doc.title}
                  </button>
                ))
              )}
            </div>
          )}

          <div className="flex gap-2 items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="항목 추가... (@문서명으로 인용)"
              className="flex-1 text-sm text-zinc-800 placeholder:text-zinc-400 outline-none bg-transparent"
            />

            {/* 아카이브 인용 버튼 */}
            <div className="relative" ref={citeRef}>
              <button
                onClick={() => setCiteOpen(o => !o)}
                title="아카이브 인용 삽입"
                className="text-xs text-zinc-400 hover:text-blue-500 transition-colors"
              >
                @인용
              </button>
              {citeOpen && (
                <div className="absolute right-0 bottom-full mb-1 w-52 bg-white border border-zinc-200 rounded-xl shadow-lg py-1 z-50 max-h-48 overflow-y-auto">
                  <p className="px-3 py-1.5 text-xs text-zinc-400 font-medium">@인용 삽입</p>
                  {archiveDocs.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-zinc-400">문서가 없습니다</p>
                  ) : (
                    archiveDocs.map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => selectCite(doc)}
                        className="w-full text-left px-3 py-2 text-xs text-zinc-700 hover:bg-blue-50 hover:text-blue-700 transition-colors truncate"
                      >
                        {doc.title}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleAdd}
              disabled={!input.trim()}
              className="text-sm font-medium text-blue-600 disabled:text-zinc-300 hover:text-blue-700 transition-colors"
            >
              추가
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
