'use client';

import { useState } from 'react';
import { useAtom } from 'jotai';
import { vehiclesAtom } from '@/store/vehicleAtoms';
import { saveVehicles } from '@/lib/storage';
import VehicleForm from './VehicleForm';
import type { Vehicle } from '@/types/vehicle';

type Mode = { type: 'list' } | { type: 'add' } | { type: 'edit'; vehicle: Vehicle };

export default function VehicleManagement() {
  const [vehicles, setVehicles] = useAtom(vehiclesAtom);
  const [mode, setMode] = useState<Mode>({ type: 'list' });

  function nextId(): string {
    const max = vehicles.reduce((m, v) => {
      const n = parseInt(v.id, 10);
      return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    return String(max + 1).padStart(8, '0');
  }

  function handleAdd(data: { licensePlate: string; department: string; name: string; registeredAt: string; remarks: string }) {
    const newVehicle: Vehicle = {
      id: nextId(),
      licensePlate: data.licensePlate,
      department: data.department,
      name: data.name,
      registeredAt: data.registeredAt,
      remarks: data.remarks,
      status: 'out',
      entryTime: null,
      exitTime: null,
    };
    const updated = [...vehicles, newVehicle];
    setVehicles(updated);
    saveVehicles(updated);
    setMode({ type: 'list' });
  }

  function handleEdit(data: { id?: string; licensePlate: string; department: string; name: string; registeredAt: string; remarks: string }) {
    const updated = vehicles.map((v) =>
      v.id === data.id
        ? { ...v, licensePlate: data.licensePlate, department: data.department, name: data.name, registeredAt: data.registeredAt, remarks: data.remarks }
        : v
    );
    setVehicles(updated);
    saveVehicles(updated);
    setMode({ type: 'list' });
  }

  function handleDelete(id: string) {
    if (!confirm('이 차량을 삭제하시겠습니까?')) return;
    const updated = vehicles.filter((v) => v.id !== id);
    setVehicles(updated);
    saveVehicles(updated);
  }

  if (mode.type === 'add') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setMode({ type: 'list' })} className="text-sm text-zinc-500 hover:text-zinc-700">← 목록</button>
          <h2 className="text-base font-semibold text-zinc-800">차량 등록</h2>
        </div>
        <div className="rounded-xl border border-zinc-200 p-5 bg-white">
          <VehicleForm
            existingPlates={vehicles.map(v => v.licensePlate)}
            onSubmit={handleAdd}
            onCancel={() => setMode({ type: 'list' })}
          />
        </div>
      </div>
    );
  }

  if (mode.type === 'edit') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setMode({ type: 'list' })} className="text-sm text-zinc-500 hover:text-zinc-700">← 목록</button>
          <h2 className="text-base font-semibold text-zinc-800">차량 수정</h2>
        </div>
        <div className="rounded-xl border border-zinc-200 p-5 bg-white">
          <VehicleForm
            vehicle={mode.vehicle}
            existingPlates={vehicles.filter(v => v.id !== mode.vehicle.id).map(v => v.licensePlate)}
            onSubmit={handleEdit}
            onCancel={() => setMode({ type: 'list' })}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-800">차량 관리</h2>
        <button
          onClick={() => setMode({ type: 'add' })}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          + 차량 등록
        </button>
      </div>

      {vehicles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 py-16 text-center text-sm text-zinc-400">
          등록된 차량이 없습니다.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-600">차량번호</th>
                <th className="px-4 py-3 font-medium text-zinc-600">부서</th>
                <th className="px-4 py-3 font-medium text-zinc-600">성함</th>
                <th className="px-4 py-3 font-medium text-zinc-600">등록일</th>
                <th className="px-4 py-3 font-medium text-zinc-600 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-zinc-900">{vehicle.licensePlate}</td>
                  <td className="px-4 py-3 text-zinc-600">{vehicle.department}</td>
                  <td className="px-4 py-3 text-zinc-600">{vehicle.name}</td>
                  <td className="px-4 py-3 text-zinc-500">{vehicle.registeredAt}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setMode({ type: 'edit', vehicle })}
                        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(vehicle.id)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
