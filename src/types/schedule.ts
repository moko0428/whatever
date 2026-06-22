export type ShiftType = 'A' | 'B' | 'C' | '휴' | '연차';

export type MonthlySchedule = {
  year: number;
  month: number;
  data: {
    [name: string]: {
      [day: number]: ShiftType;
    };
  };
};
