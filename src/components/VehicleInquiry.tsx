'use client';

import { useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { vehiclesAtom, selectedVehicleIdAtom } from '@/store/vehicleAtoms';
import { saveVehicles } from '@/lib/storage';
import VehicleDetail from './VehicleDetail';
import type { Vehicle } from '@/types/vehicle';

function StatusBadge({ vehicle }: { vehicle: Vehicle }) {
  if (!vehicle.entryTime) {
    return <span className="text-sm text-zinc-400">-</span>;
  }
  if (vehicle.status === 'in') {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
        입차
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
      출차
    </span>
  );
}

export default function VehicleInquiry() {
  const [vehicles, setVehicles] = useAtom(vehiclesAtom);
  const setSelectedId = useSetAtom(selectedVehicleIdAtom);
  const [searchQuery, setSearchQuery] = useState('');

  function toggleStatus(vehicle: Vehicle) {
    const now = new Date().toISOString();
    const updated = vehicles.map((v) => {
      if (v.id !== vehicle.id) return v;
      if (v.status === 'out') {
        return { ...v, status: 'in' as const, entryTime: now, exitTime: null };
      } else {
        return { ...v, status: 'out' as const, exitTime: now };
      }
    });
    setVehicles(updated);
    saveVehicles(updated);
  }

  const filtered = vehicles.filter((v) =>
    searchQuery
      ? v.licensePlate.replace(/\s/g, '').toLowerCase().includes(searchQuery.replace(/\s/g, '').toLowerCase())
      : true
  );

  const sorted = [...filtered].sort((a, b) => {
    if (a.status === b.status) return 0;
    return a.status === 'in' ? -1 : 1;
  });

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-800">차량 목록</h2>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-green-600 font-medium">입차 {vehicles.filter(v => v.status === 'in').length}대</span>
          <span className="text-zinc-300">|</span>
          <span className="text-zinc-500">출차 {vehicles.filter(v => v.status === 'out').length}대</span>
          <span className="text-zinc-300">|</span>
          <span className="text-zinc-700 font-medium">총 {vehicles.length}대</span>
        </div>
      </div>

      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="차량번호 검색"
          className="w-full rounded-lg border border-zinc-300 pl-9 pr-9 py-2 text-sm text-zinc-700 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-base leading-none"
          >
            ×
          </button>
        )}
      </div>

      {vehicles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 py-16 text-center text-sm text-zinc-400">
          등록된 차량이 없습니다.<br />차량 관리 탭에서 차량을 등록해 주세요.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 py-16 text-center text-sm text-zinc-400">
          검색 결과가 없습니다.
        </div>
      ) : (
        <div className="flex-1 overflow-auto min-h-0 rounded-xl border border-zinc-200">
          <table className="w-full text-sm">
            <thead className="bg-zinc-200 text-left sticky top-0">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-700 border-b-2 border-zinc-300">ID</th>
                <th className="px-4 py-3 font-medium text-zinc-700 border-b-2 border-zinc-300">차량번호</th>
                <th className="px-4 py-3 font-medium text-zinc-700 border-b-2 border-zinc-300">상태</th>
                <th className="px-4 py-3 font-medium text-zinc-700 border-b-2 border-zinc-300 text-right">입/출차</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {sorted.map((vehicle) => (
                <tr
                  key={vehicle.id}
                  className="cursor-pointer hover:bg-zinc-50 transition-colors"
                  onClick={() => setSelectedId(vehicle.id)}
                >
                  <td className="px-4 py-3 text-zinc-500 font-mono text-xs">{vehicle.id}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900">{vehicle.licensePlate}</td>
                  <td className="px-4 py-3">
                    <StatusBadge vehicle={vehicle} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStatus(vehicle);
                      }}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        vehicle.status === 'out'
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-zinc-600 text-white hover:bg-zinc-700'
                      }`}
                    >
                      {vehicle.status === 'out' ? '입차 처리' : '출차 처리'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <VehicleDetail />
    </div>
  );
}
