'use client';

import { useState } from 'react';
import { mergeUserSchedule } from '@/lib/scheduleStorage';
import { MonthlySchedule, ShiftType } from '@/types/schedule';

type Props = {
  onSuccess: () => void;
  userName: string;
};

const SHIFTS: ShiftType[] = ['A', 'B', 'C', '휴', '연차'];
const SHIFT_LABEL: Record<ShiftType, string> = { A: '주', B: '석', C: '야', '휴': '휴', '연차': '연' };
const SHIFT_COLOR: Record<ShiftType, string> = {
  A: 'bg-orange-400 text-white',
  B: 'bg-blue-500 text-white',
  C: 'bg-zinc-800 text-white',
  '휴': 'bg-green-500 text-white',
  '연차': 'bg-red-500 text-white',
};

const DOW = ['일', '월', '화', '수', '목', '금', '토'];

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function buildWeeks(year: number, month: number): (number | null)[][] {
  const total = daysInMonth(year, month);
  const firstDow = new Date(year, month - 1, 1).getDay();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];
  const trailing = (7 - (cells.length % 7)) % 7;
  cells.push(...Array(trailing).fill(null));
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export default function ScheduleUpload({ onSuccess, userName }: Props) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [data, setData] = useState<Record<string, Record<number, ShiftType>>>({});
  const [saving, setSaving] = useState(false);

  const weeks = buildWeeks(year, month);

  const toggle = (name: string, day: number) => {
    setData(prev => {
      const memberData = { ...(prev[name] ?? {}) };
      const cur = memberData[day];
      const idx = cur ? SHIFTS.indexOf(cur) : -1;
      if (idx === SHIFTS.length - 1) {
        delete memberData[day];
      } else {
        memberData[day] = SHIFTS[idx + 1];
      }
      return { ...prev, [name]: memberData };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const schedule: MonthlySchedule = { year, month, data: { [userName]: data[userName] ?? {} } };
    await mergeUserSchedule(userName, schedule);
    setOpen(false);
    setData({});
    setSaving(false);
    onSuccess();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        스케줄 등록
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-900">스케줄 등록</h2>
          <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-700 text-xl leading-none">×</button>
        </div>

        {/* Year / Month */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-3">
          <select
            value={year}
            onChange={e => { setYear(Number(e.target.value)); setData({}); }}
            className="text-sm text-zinc-800 border border-zinc-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500"
          >
            {[today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1].map(y => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
          <select
            value={month}
            onChange={e => { setMonth(Number(e.target.value)); setData({}); }}
            className="text-sm text-zinc-800 border border-zinc-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{m}월</option>
            ))}
          </select>
          <span className="text-xs text-zinc-400">셀을 클릭해서 근무 유형을 순환 선택</span>
        </div>

        {/* Legend */}
        <div className="px-6 py-2 border-b border-zinc-100 flex items-center gap-3 flex-wrap">
          {SHIFTS.map(s => (
            <div key={s} className="flex items-center gap-1">
              <div className={`w-5 h-5 rounded text-center text-xs leading-5 font-medium ${SHIFT_COLOR[s]}`}>{SHIFT_LABEL[s]}</div>
              <span className="text-xs text-zinc-500">{s === '연차' ? '연차' : s === '휴' ? '휴무' : s === 'A' ? '주간' : s === 'B' ? '석간' : '야간'}</span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded border border-zinc-200 bg-zinc-50" />
            <span className="text-xs text-zinc-400">미입력</span>
          </div>
        </div>

        {/* Grid — 달력형 */}
        <div className="px-6 py-4">
          {/* 요일 헤더 */}
          <div className="flex gap-1.5 mb-1.5">
            {DOW.map(d => (
              <div key={d} className="w-9 text-center text-xs font-medium text-zinc-400">{d}</div>
            ))}
          </div>
          {/* 주차별 행 */}
          <div className="space-y-1.5">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex gap-1.5">
                {week.map((day, di) => {
                  if (day === null) {
                    return <div key={di} className="w-9 h-11" />;
                  }
                  const shift = data[userName]?.[day];
                  return (
                    <button
                      key={di}
                      onClick={() => toggle(userName, day)}
                      className={`w-9 h-11 rounded-lg flex items-center justify-center transition-colors ${
                        shift ? SHIFT_COLOR[shift] : 'bg-zinc-100 hover:bg-zinc-200'
                      }`}
                    >
                      <span className={`text-xs ${shift ? 'text-white' : 'text-zinc-500'}`}>{day}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 flex justify-end gap-2">
          <button
            onClick={() => setOpen(false)}
            className="text-sm text-zinc-400 hover:text-zinc-600 px-4 py-2 rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 px-5 py-2 rounded-lg transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
