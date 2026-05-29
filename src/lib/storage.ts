import type { Vehicle } from '@/types/vehicle';

const STORAGE_KEY = 'vehicles';

export function loadVehicles(): Vehicle[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Vehicle[]) : [];
  } catch {
    return [];
  }
}

export function saveVehicles(vehicles: Vehicle[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
}
