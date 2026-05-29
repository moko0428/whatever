'use client';

import { useState } from 'react';
import type { Vehicle } from '@/types/vehicle';

type FormData = {
  licensePlate: string;
  department: string;
  name: string;
  registeredAt: string;
  remarks: string;
};

type Props = {
  vehicle?: Vehicle;
  existingPlates?: string[];
  onSubmit: (data: FormData & { id?: string }) => void;
  onCancel: () => void;
};

function normalize(plate: string) {
  return plate.replace(/\s/g, '').toLowerCase();
}

export default function VehicleForm({ vehicle, existingPlates = [], onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<FormData>({
    licensePlate: vehicle?.licensePlate ?? '',
    department: vehicle?.department ?? '',
    name: vehicle?.name ?? '',
    registeredAt: vehicle?.registeredAt ?? new Date().toISOString().slice(0, 10),
    remarks: vehicle?.remarks ?? '',
  });
  const [plateError, setPlateError] = useState('');

  function checkDuplicate(value: string) {
    const isDuplicate = existingPlates.some((p) => normalize(p) === normalize(value));
    setPlateError(isDuplicate ? '이미 등록된 차량번호입니다.' : '');
    return isDuplicate;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'licensePlate') {
      if (value.trim()) checkDuplicate(value);
      else setPlateError('');
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (checkDuplicate(form.licensePlate)) return;
    onSubmit({ ...form, id: vehicle?.id });
  }

  const isEdit = Boolean(vehicle);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">차량번호 *</label>
        <input
          name="licensePlate"
          value={form.licensePlate}
          onChange={handleChange}
          required
          placeholder="예: 12가 3456"
          className={`rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-1 ${
            plateError
              ? 'border-red-400 focus:border-red-500 focus:ring-red-400'
              : 'border-zinc-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
        />
        {plateError && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {plateError}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">부서 *</label>
        <input
          name="department"
          value={form.department}
          onChange={handleChange}
          required
          placeholder="예: 개발팀"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">성함 *</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          placeholder="예: 홍길동"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">비고</label>
        <textarea
          name="remarks"
          value={form.remarks}
          onChange={handleChange}
          rows={3}
          placeholder="추가 메모"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
        />
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={!!plateError}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isEdit ? '수정' : '등록'}
        </button>
      </div>
    </form>
  );
}
