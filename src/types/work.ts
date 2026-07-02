export type ChecklistItem = {
  id: string;
  text: string;
  checked: boolean;
  archiveId?: string;
};

export type ShiftTab = 'A' | 'B' | 'C';

export type DayRecord = {
  date: string;
  checklist: ChecklistItem[]; // legacy
  checklists?: { [K in ShiftTab]?: ChecklistItem[] };
  handover: string;
  specialNotes: string;
};

export type SharedItemType = 'handover' | 'specialNote';

export type SharedItem = {
  id: string;
  type: SharedItemType;
  text: string;
  description?: string;
  author: string;
  resolved: boolean;
  date: string; // YYYY-MM-DD (작성일)
};
