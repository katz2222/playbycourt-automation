export interface TimeSlot {
  date: string;
  start: number;
  end: number;
}

export interface ApiSlot {
  facility_schedule_id: number;
  schedule: string; // e.g. "6-6:30am"
  shift: string;
  available: boolean;
  seconds_from_midnight: number;
  in_waitlist: boolean;
  group: number;
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
