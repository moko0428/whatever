'use client';

import { useState, KeyboardEvent } from 'react';
import { SharedItem } from '@/types/work';

type AddData = {
  text: string;
  description?: string;
};

type Props = {
  title: string;
  items: SharedItem[];
  currentDate: string;
  userName: string;
  extendedForm?: boolean;
  onAdd: (data: AddData) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
};

function dayDiff(from: string, to: string): number {
  const a = new Date(from + 'T00:00:00');
  const b = new Date(to + 'T00:00:00');
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function SimpleForm({ onAdd }: { onAdd: (data: AddData) => void }) {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    const text = input.trim();
    if (!text) return;
    onAdd({ text });
    setInput('');
  };

  return (
    <div className="px-5 py-3 border-t border-zinc-100 flex gap-2">
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAdd(); }}
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
  );
}

function HandoverForm({ onAdd }: { onAdd: (data: AddData) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [description, setDescription] = useState('');

  const reset = () => { setText(''); setDescription(''); };

  const handleSubmit = () => {
    if (!text.trim()) return;
    onAdd({ text: text.trim(), description: description.trim() || undefined });
    reset();
    setOpen(false);
  };

  if (!open) {
    return (
      <div className="px-5 py-3 border-t border-zinc-100">
        <button
          onClick={() => setOpen(true)}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          + 항목 추가
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-zinc-100 px-5 py-4 space-y-3 bg-zinc-50">
      <input
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="내용"
        className="w-full text-sm text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 bg-white"
        autoFocus
      />
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="설명 (선택)"
        rows={2}
        className="w-full text-sm text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 bg-white resize-none"
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={() => { reset(); setOpen(false); }}
          className="text-sm text-zinc-400 hover:text-zinc-600 px-3 py-1 rounded transition-colors"
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 px-4 py-1 rounded-lg transition-colors"
        >
          추가
        </button>
      </div>
    </div>
  );
}

export default function SharedSection({
  title,
  items,
  currentDate,
  userName,
  extendedForm = false,
  onAdd,
  onToggle,
  onRemove,
}: Props) {
  const unresolved = items.filter(i => !i.resolved).length;

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
        <h2 className="font-semibold text-zinc-900">{title}</h2>
        {unresolved > 0 && (
          <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
            미완 {unresolved}
          </span>
        )}
      </div>

      <ul className="divide-y divide-zinc-50">
        {items.length === 0 && (
          <li className="px-5 py-6 text-sm text-zinc-400 text-center">등록된 항목이 없습니다</li>
        )}
        {items.map(item => {
          const isCarried = item.date < currentDate;
          const diff = isCarried ? dayDiff(item.date, currentDate) : 0;

          return (
            <li
              key={item.id}
              className={`flex items-start gap-3 px-5 py-3 ${isCarried && !item.resolved ? 'bg-amber-50' : ''}`}
            >
              <button
                onClick={() => onToggle(item.id)}
                className={`mt-0.5 w-5 h-5 rounded shrink-0 border-2 flex items-center justify-center transition-colors ${
                  item.resolved
                    ? 'bg-zinc-400 border-zinc-400'
                    : 'border-zinc-300 hover:border-blue-400'
                }`}
              >
                {item.resolved && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p className={`text-sm ${item.resolved ? 'line-through text-zinc-400' : 'text-zinc-800'}`}>
                  {item.text}
                </p>
                {item.description && (
                  <p className={`text-xs mt-0.5 ${item.resolved ? 'text-zinc-300' : 'text-zinc-500'}`}>
                    {item.description}
                  </p>
                )}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-zinc-400">{item.author}</span>
                  {isCarried && !item.resolved && (
                    <span className="text-xs text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                      {diff}일 전
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => onRemove(item.id)}
                className="mt-0.5 text-zinc-300 hover:text-red-500 transition-colors text-lg leading-none shrink-0"
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>

      {extendedForm
        ? <HandoverForm onAdd={onAdd} />
        : <SimpleForm onAdd={onAdd} />
      }
    </div>
  );
}
