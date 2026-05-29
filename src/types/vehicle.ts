export type VehicleStatus = 'in' | 'out';

export type Vehicle = {
  id: string;
  licensePlate: string;
  department: string;
  name: string;
  registeredAt: string;
  status: VehicleStatus;
  entryTime: string | null;
  exitTime: string | null;
  remarks: string;
};
