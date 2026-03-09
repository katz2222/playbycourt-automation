export interface TimeSlot {
  date: string;
  start: number;
  end: number;
}

export interface SlotHistoryRecord {
  TimeSlot: TimeSlot;
  becameAvailableAt: string;
  becameUnavailableAt?: string;
}

export interface ScanCourtSlotsOptions {
  startDate: Date;
  endDate: Date;
  startHour: number;
  endHour: number;
  skipWeekend?: boolean;
  skipWeekdays?: number[];
}
