'use client';

import { useAtomValue, useSetAtom } from 'jotai';
import { selectedVehicleAtom, selectedVehicleIdAtom } from '@/store/vehicleAtoms';

function formatDateTime(iso: string | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function calcParkingDuration(entryTime: string | null, exitTime: string | null): string {
  if (!entryTime) return '-';
  const end = exitTime ? new Date(exitTime).getTime() : Date.now();
  const diff = Math.max(0, end - new Date(entryTime).getTime());
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const label = exitTime ? '' : ' (주차 중)';
  return `${h}시간 ${m}분 ${s}초${label}`;
}

type RowProps = { label: string; value: string };

function Row({ label, value }: RowProps) {
  return (
    <div className="flex gap-2 py-2 border-b border-zinc-100 last:border-0">
      <span className="w-28 shrink-0 text-sm font-medium text-zinc-500">{label}</span>
      <span className="text-sm text-zinc-900 break-all">{value}</span>
    </div>
  );
}

export default function VehicleDetail() {
  const vehicle = useAtomValue(selectedVehicleAtom);
  const setSelectedId = useSetAtom(selectedVehicleIdAtom);

  if (!vehicle) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelectedId(null)}>
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900">차량 상세 정보</h2>
          <button
            onClick={() => setSelectedId(null)}
            className="text-zinc-400 hover:text-zinc-600 transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>
        <div className="flex flex-col">
          <Row label="ID" value={vehicle.id} />
          <Row label="차량번호" value={vehicle.licensePlate} />
          <Row label="부서" value={vehicle.department} />
          <Row label="성함" value={vehicle.name} />
          <Row label="차량 등록일" value={vehicle.registeredAt} />
          <Row label="상태" value={vehicle.status === 'in' ? '입차' : '출차'} />
          <Row label="입차 시간" value={formatDateTime(vehicle.entryTime)} />
          <Row label="출차 시간" value={formatDateTime(vehicle.exitTime)} />
          <Row label="주차 시간" value={calcParkingDuration(vehicle.entryTime, vehicle.exitTime)} />
          <Row label="비고" value={vehicle.remarks || '-'} />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setSelectedId(null)}
            className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
