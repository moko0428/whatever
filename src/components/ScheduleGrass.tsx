'use client';

import { useMemo, useState } from 'react';
import { MonthlySchedule, ShiftType } from '@/types/schedule';

type Props = {
  schedules: MonthlySchedule[];
  userName: string;
};

const SHIFT_COLOR: Record<ShiftType, string> = {
  A:     'bg-orange-400 text-white',
  B:     'bg-blue-500 text-white',
  C:     'bg-zinc-800 text-white',
  '휴':  'bg-green-500 text-white',
  '연차':'bg-red-500 text-white',
};

const SHIFT_LABEL: Record<ShiftType, string> = {
  A: '주간', B: '석간', C: '야간', '휴': '휴무', '연차': '연차',
};

const DOW = ['일','월','화','수','목','금','토'];
const MONTH_KR = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

function buildWeeks(year: number, month: number): (number | null)[][] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDow = new Date(year, month - 1, 1).getDay();
  const total = firstDow + daysInMonth;
  const trailing = (7 - (total % 7)) % 7;
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ...Array(trailing).fill(null),
  ];
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

// ── Skeleton ─────────────────────────────────────────────────────────────
function Skeleton() {
  const fakeWeeks = buildWeeks(new Date().getFullYear(), new Date().getMonth() + 1);
  return (
    <div className="flex gap-4 px-5 py-4">
      <div className="flex-1">
        <div className="h-4 w-24 bg-zinc-200 animate-pulse rounded mb-4" />
        <div className="flex flex-col gap-1.5">
          {/* DOW header */}
          <div className="flex gap-1.5">
            {DOW.map(d => (
              <div key={d} className="w-8 h-5 flex items-center justify-center">
                <span className="text-xs text-zinc-300">{d}</span>
              </div>
            ))}
          </div>
          {/* Week rows */}
          {fakeWeeks.map((_, wi) => (
            <div key={wi} className="flex gap-1.5">
              {Array.from({ length: 7 }).map((__, di) => (
                <div
                  key={di}
                  className="w-8 h-8 rounded-md bg-zinc-200 animate-pulse"
                  style={{ animationDelay: `${(wi * 7 + di) * 15}ms` }}
                />
              ))}
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-400 mt-3">스케줄을 등록하면 여기에 표시됩니다</p>
      </div>
      {/* Fake month list */}
      <div className="flex flex-col gap-1.5 min-w-[52px]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-6 w-12 bg-zinc-200 animate-pulse rounded" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────
export default function ScheduleGrass({ schedules, userName }: Props) {
  const available = useMemo(
    () =>
      [...schedules]
        .filter(s => s.data[userName])
        .sort((a, b) => b.year - a.year || b.month - a.month),
    [schedules, userName],
  );

  const [selected, setSelected] = useState<{ year: number; month: number } | null>(null);

  const current = useMemo(() => {
    if (available.length === 0) return null;
    const key = selected ?? { year: available[0].year, month: available[0].month };
    return available.find(s => s.year === key.year && s.month === key.month) ?? available[0];
  }, [available, selected]);

  if (available.length === 0) return <Skeleton />;

  const shiftMap: Record<number, ShiftType> = {};
  if (current) {
    const data = current.data[userName];
    if (data) {
      for (const [day, shift] of Object.entries(data)) {
        shiftMap[Number(day)] = shift as ShiftType;
      }
    }
  }

  const weeks = current ? buildWeeks(current.year, current.month) : [];

  return (
    <div className="flex gap-4 px-5 py-4">
      {/* Left: grass */}
      <div className="flex-1 min-w-0">
        {current && (
          <p className="text-xs font-medium text-zinc-500 mb-3">
            {current.year}년 {MONTH_KR[current.month - 1]}
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          {/* Day-of-week header */}
          <div className="flex gap-1.5">
            {DOW.map(d => (
              <div key={d} className="w-8 h-5 flex items-center justify-center">
                <span className="text-xs text-zinc-400">{d}</span>
              </div>
            ))}
          </div>

          {/* Week rows */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex gap-1.5">
              {week.map((day, di) => (
                <div
                  key={di}
                  title={day && shiftMap[day] ? SHIFT_LABEL[shiftMap[day]] : undefined}
                  className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium select-none
                    ${day === null
                      ? 'opacity-0 pointer-events-none'
                      : shiftMap[day]
                        ? SHIFT_COLOR[shiftMap[day]]
                        : 'bg-zinc-100 text-zinc-400'
                    }`}
                >
                  {day}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
          {(Object.entries(SHIFT_LABEL) as [ShiftType, string][]).map(([type, label]) => (
            <div key={type} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-sm ${SHIFT_COLOR[type].split(' ')[0]}`} />
              <span className="text-xs text-zinc-500">{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-zinc-100" />
            <span className="text-xs text-zinc-400">미등록</span>
          </div>
        </div>
      </div>

      {/* Right: month list */}
      <div className="flex flex-col gap-1 shrink-0">
        {available.map(s => {
          const isSel = current?.year === s.year && current?.month === s.month;
          return (
            <button
              key={`${s.year}-${s.month}`}
              onClick={() => setSelected({ year: s.year, month: s.month })}
              className={`text-xs px-2.5 py-1 rounded-lg text-left transition-colors whitespace-nowrap
                ${isSel
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-zinc-500 hover:bg-zinc-100'
                }`}
            >
              {s.year}년 {MONTH_KR[s.month - 1]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
