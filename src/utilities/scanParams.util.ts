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
 * Reads SCAN_* values from the provided env object (or falls back to
 * env-variables module defaults), validates them, and returns a
 * ScanCourtSlotsOptions object.
 *
 * @param env - Optional record of environment variable overrides.
 *              When omitted, values are read from the env-variables module.
 */
export function parseScanParams(
  env?: Record<string, string | undefined>,
): ScanCourtSlotsOptions {
  // Default values when env object is provided but key is missing
  const DEFAULTS = {
    SCAN_START_DATE_OFFSET: 1,
    SCAN_END_DATE_OFFSET: 1,
    SCAN_START_HOUR: 10,
    SCAN_END_HOUR: 19,
    SCAN_SKIP_WEEKEND: false,
    SCAN_SKIP_WEEKDAYS: "",
  };

  // Helper to parse a number (integer or float) from the env object, with a fallback
  function readNumber(
    key: string,
    moduleDefault: number,
    hardDefault: number,
  ): number {
    if (env !== undefined) {
      const raw = env[key];
      if (raw === undefined || raw === "") return hardDefault;
      const parsed = Number(raw);
      if (isNaN(parsed)) return NaN;
      return parsed;
    }
    return moduleDefault;
  }

  // Helper to parse an integer from the env object, with a fallback
  function readInt(
    key: string,
    moduleDefault: number,
    hardDefault: number,
  ): number {
    if (env !== undefined) {
      const raw = env[key];
      if (raw === undefined || raw === "") return hardDefault;
      const parsed = Number(raw);
      if (!Number.isInteger(parsed)) return NaN;
      return parsed;
    }
    return moduleDefault;
  }

  function readString(
    key: string,
    moduleDefault: string,
    hardDefault: string,
  ): string {
    if (env !== undefined) {
      return env[key] ?? hardDefault;
    }
    return moduleDefault;
  }

  function readBool(
    key: string,
    moduleDefault: boolean,
    hardDefault: boolean,
  ): boolean {
    if (env !== undefined) {
      const raw = env[key];
      if (raw === undefined) return hardDefault;
      return raw === "true";
    }
    return moduleDefault;
  }

  const startDateOffset = readInt(
    "SCAN_START_DATE_OFFSET",
    SCAN_START_DATE_OFFSET,
    DEFAULTS.SCAN_START_DATE_OFFSET,
  );
  const endDateOffset = readInt(
    "SCAN_END_DATE_OFFSET",
    SCAN_END_DATE_OFFSET,
    DEFAULTS.SCAN_END_DATE_OFFSET,
  );
  const startHour = readNumber(
    "SCAN_START_HOUR",
    SCAN_START_HOUR,
    DEFAULTS.SCAN_START_HOUR,
  );
  const endHour = readNumber(
    "SCAN_END_HOUR",
    SCAN_END_HOUR,
    DEFAULTS.SCAN_END_HOUR,
  );
  const skipWeekend = readBool(
    "SCAN_SKIP_WEEKEND",
    SCAN_SKIP_WEEKEND,
    DEFAULTS.SCAN_SKIP_WEEKEND,
  );
  const skipWeekdaysStr = readString(
    "SCAN_SKIP_WEEKDAYS",
    SCAN_SKIP_WEEKDAYS,
    DEFAULTS.SCAN_SKIP_WEEKDAYS,
  );
  const skipWeekdays: number[] = skipWeekdaysStr
    ? skipWeekdaysStr.split(",").map((s) => parseInt(s.trim(), 10))
    : [];

  // --- Validation ---

  if (isNaN(startHour) || startHour < 0 || startHour > 23.5) {
    throw new Error(
      `SCAN_START_HOUR must be a number between 0 and 23.5 (use .5 for half hours), got: ${startHour}`,
    );
  }

  if (isNaN(endHour) || endHour < 0.5 || endHour > 24) {
    throw new Error(
      `SCAN_END_HOUR must be a number between 0.5 and 24 (use .5 for half hours), got: ${endHour}`,
    );
  }

  if (startHour >= endHour) {
    throw new Error(
      `SCAN_START_HOUR (${startHour}) must be less than SCAN_END_HOUR (${endHour})`,
    );
  }

  if (!Number.isInteger(startDateOffset) || startDateOffset < 0) {
    throw new Error(
      `SCAN_START_DATE_OFFSET must be a non-negative integer, got: ${startDateOffset}`,
    );
  }

  if (!Number.isInteger(endDateOffset) || endDateOffset < 0) {
    throw new Error(
      `SCAN_END_DATE_OFFSET must be a non-negative integer, got: ${endDateOffset}`,
    );
  }

  if (startDateOffset > endDateOffset) {
    throw new Error(
      `SCAN_START_DATE_OFFSET (${startDateOffset}) must be less than or equal to SCAN_END_DATE_OFFSET (${endDateOffset})`,
    );
  }

  for (const day of skipWeekdays) {
    if (!Number.isInteger(day) || day < 0 || day > 6) {
      throw new Error(
        `SCAN_SKIP_WEEKDAYS contains invalid weekday number: ${day}. Must be 0-6`,
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
