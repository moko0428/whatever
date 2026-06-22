'use client';

import { useState, KeyboardEvent } from 'react';
import { ChecklistItem, ShiftTab } from '@/types/work';

type Checklists = { [K in ShiftTab]: ChecklistItem[] };

type Props = {
  checklists: Checklists;
  onToggle: (tab: ShiftTab, id: string) => void;
  onAdd: (tab: ShiftTab, text: string) => void;
  onRemove: (tab: ShiftTab, id: string) => void;
};

const TABS: { key: ShiftTab; label: string }[] = [
  { key: 'A', label: '주간' },
  { key: 'B', label: '석간' },
  { key: 'C', label: '야간' },
];

export default function ChecklistSection({ checklists, onToggle, onAdd, onRemove }: Props) {
  const [tab, setTab] = useState<ShiftTab>('A');
  const [input, setInput] = useState('');

  const items = checklists[tab];
  const done = items.filter(i => i.checked).length;

  const handleAdd = () => {
    const text = input.trim();
    if (!text) return;
    onAdd(tab, text);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
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
            onClick={() => { setTab(t.key); setInput(''); }}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              tab === t.key
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ul className="divide-y divide-zinc-50">
        {items.length === 0 && (
          <li className="px-5 py-6 text-sm text-zinc-400 text-center">
            아래에서 항목을 추가하세요
          </li>
        )}
        {items.map(item => (
          <li key={item.id} className="flex items-center gap-3 px-5 py-3">
            <button
              onClick={() => onToggle(tab, item.id)}
              className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
                item.checked
                  ? 'bg-blue-600 border-blue-600'
                  : 'border-zinc-300 hover:border-blue-400'
              }`}
            >
              {item.checked && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <span className={`flex-1 text-sm ${item.checked ? 'line-through text-zinc-400' : 'text-zinc-800'}`}>
              {item.text}
            </span>
            <button
              onClick={() => onRemove(tab, item.id)}
              className="text-zinc-300 hover:text-red-500 transition-colors text-lg leading-none"
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <div className="px-5 py-3 border-t border-zinc-100 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="항목 추가..."
          className="flex-1 text-sm text-zinc-800 placeholder:text-zinc-400 outline-none bg-transparent"
        />
        <button
          onClick={handleAdd}
          disabled={!input.trim()}
          className="text-sm font-medium text-blue-600 disabled:text-zinc-300 hover:text-blue-700 transition-colors"
        >
          추가
        </button>
      </div>
    </div>
  );
}
