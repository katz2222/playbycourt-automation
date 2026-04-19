import {
  SCAN_START_DATE_OFFSET,
  SCAN_END_DATE_OFFSET,
  SCAN_START_HOUR,
  SCAN_END_HOUR,
  SCAN_SKIP_WEEKEND,
  SCAN_SKIP_WEEKDAYS,
} from "../../env-variables";
import { ScanCourtSlotsOptions } from "./types.util";

/**
 * Reads SCAN_* values from env-variables, validates them,
 * and returns a ScanCourtSlotsOptions object.
 */
export function parseScanParams(): ScanCourtSlotsOptions {
  const startDateOffset = SCAN_START_DATE_OFFSET;
  const endDateOffset = SCAN_END_DATE_OFFSET;
  const startHour = SCAN_START_HOUR;
  const endHour = SCAN_END_HOUR;
  const skipWeekend = SCAN_SKIP_WEEKEND;
  const skipWeekdays: number[] = SCAN_SKIP_WEEKDAYS
    ? SCAN_SKIP_WEEKDAYS.split(",").map((s) => parseInt(s.trim(), 10))
    : [];

  // --- Validation ---

  if (startHour < 0 || startHour > 23) {
    throw new Error(
      `SCAN_START_HOUR must be between 0 and 23, got: ${startHour}`,
    );
  }

  if (endHour < 1 || endHour > 24) {
    throw new Error(`SCAN_END_HOUR must be between 1 and 24, got: ${endHour}`);
  }

  if (startHour >= endHour) {
    throw new Error(
      `SCAN_START_HOUR (${startHour}) must be less than SCAN_END_HOUR (${endHour})`,
    );
  }

  if (startDateOffset < 0) {
    throw new Error(
      `SCAN_START_DATE_OFFSET must be non-negative, got: ${startDateOffset}`,
    );
  }

  if (endDateOffset < 0) {
    throw new Error(
      `SCAN_END_DATE_OFFSET must be non-negative, got: ${endDateOffset}`,
    );
  }

  if (startDateOffset > endDateOffset) {
    throw new Error(
      `SCAN_START_DATE_OFFSET (${startDateOffset}) must be <= SCAN_END_DATE_OFFSET (${endDateOffset})`,
    );
  }

  for (const day of skipWeekdays) {
    if (!Number.isInteger(day) || day < 0 || day > 6) {
      throw new Error(
        `SCAN_SKIP_WEEKDAYS contains invalid weekday: ${day}. Must be 0-6`,
      );
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() + startDateOffset);

  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + endDateOffset);

  return {
    startDate,
    endDate,
    startHour,
    endHour,
    skipWeekend,
    skipWeekdays,
  };
}
