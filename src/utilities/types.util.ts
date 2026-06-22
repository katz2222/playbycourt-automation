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

interface BaseScanOptions {
  startHour: number;
  endHour: number;
}

interface OffsetModeScanOptions extends BaseScanOptions {
  startDate: Date;
  endDate: Date;
  skipWeekend?: boolean;
  skipWeekdays?: number[];
  specificDates?: never;
}

interface SpecificDatesModeScanOptions extends BaseScanOptions {
  specificDates: Date[];
  startDate?: never;
  endDate?: never;
  skipWeekend?: never;
  skipWeekdays?: never;
}

export type ScanCourtSlotsOptions =
  | OffsetModeScanOptions
  | SpecificDatesModeScanOptions;
