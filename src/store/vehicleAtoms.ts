import { atom } from 'jotai';
import { loadVehicles } from '@/lib/storage';
import type { Vehicle } from '@/types/vehicle';

export const vehiclesAtom = atom<Vehicle[]>([]);

export const vehiclesInitializedAtom = atom(false);

export const selectedVehicleIdAtom = atom<string | null>(null);

export const selectedVehicleAtom = atom<Vehicle | null>((get) => {
  const id = get(selectedVehicleIdAtom);
  if (!id) return null;
  return get(vehiclesAtom).find((v) => v.id === id) ?? null;
});

export function createInitialVehicles(): Vehicle[] {
  return loadVehicles();
}
