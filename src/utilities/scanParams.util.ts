import {
  SCAN_START_DATE_OFFSET,
  SCAN_END_DATE_OFFSET,
  SCAN_START_HOUR,
  SCAN_END_HOUR,
  SCAN_SKIP_WEEKEND,
  SCAN_SKIP_WEEKDAYS,
  SCAN_SPECIFIC_DATES,
  SCAN_MIN_PLAYTIME_HOURS,
} from "../../env-variables";
import { ScanCourtSlotsOptions } from "./types.util";
import {
  validateHours,
  validateOffsets,
  validateSkipWeekdays,
  validateMinPlaytimeHours,
  findConflictingParams,
  parseDateToken,
} from "./scanParamsValidation.util";

/**
 * Reads a string value: from env record if provided, otherwise module-level.
 * When env is provided, missing keys are treated as empty string (not set).
 */
function readEnvString(
  env: Record<string, string | undefined> | undefined,
  key: string,
  moduleVal: string,
): string {
  if (env !== undefined) return env[key] ?? "";
  return moduleVal;
}

/**
 * Reads a number value: from env record if provided, otherwise module-level.
 * When env is provided, missing keys return NaN (will fail validation).
 */
function readEnvNumber(
  env: Record<string, string | undefined> | undefined,
  key: string,
  moduleVal: number,
): number {
  if (env !== undefined) {
    const raw = env[key];
    if (raw === undefined || raw === "") return NaN;
    return Number(raw);
  }
  return moduleVal;
}

function parseSpecificDates(
  raw: string,
  env: Record<string, string | undefined> | undefined,
  startHour: number,
  endHour: number,
  minPlaytimeHours: number,
): ScanCourtSlotsOptions | null {
  const conflicting = findConflictingParams(env);
  if (conflicting.length > 0) {
    throw new Error(
      `SCAN_SPECIFIC_DATES cannot be used with: ${conflicting.join(", ")}`,
    );
  }

  const parsedDates = raw.split(",").map((s) => parseDateToken(s.trim()));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const futureDates: Date[] = [];
  for (const date of parsedDates) {
    if (date < today) {
      console.log(
        `Skipping past date: ${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`,
      );
    } else {
      futureDates.push(date);
    }
  }

  if (futureDates.length === 0) return null;

  futureDates.sort((a, b) => a.getTime() - b.getTime());
  return {
    specificDates: futureDates,
    startHour,
    endHour,
    minPlaytimeHours,
  };
}

function parseOffsetMode(
  env: Record<string, string | undefined> | undefined,
  startHour: number,
  endHour: number,
  minPlaytimeHours: number,
): ScanCourtSlotsOptions {
  const rawStart =
    env !== undefined ? env["SCAN_START_DATE_OFFSET"] : SCAN_START_DATE_OFFSET;
  const rawEnd =
    env !== undefined ? env["SCAN_END_DATE_OFFSET"] : SCAN_END_DATE_OFFSET;

  if (!rawStart || rawStart === "") {
    throw new Error("SCAN_START_DATE_OFFSET is required in offset mode");
  }
  if (!rawEnd || rawEnd === "") {
    throw new Error("SCAN_END_DATE_OFFSET is required in offset mode");
  }

  const startDateOffset = parseInt(rawStart, 10);
  const endDateOffset = parseInt(rawEnd, 10);

  if (isNaN(startDateOffset) || String(startDateOffset) !== rawStart) {
    throw new Error(
      `SCAN_START_DATE_OFFSET must be a non-negative integer, got: ${rawStart}`,
    );
  }
  if (isNaN(endDateOffset) || String(endDateOffset) !== rawEnd) {
    throw new Error(
      `SCAN_END_DATE_OFFSET must be a non-negative integer, got: ${rawEnd}`,
    );
  }

  const skipWeekendRaw = readEnvString(
    env,
    "SCAN_SKIP_WEEKEND",
    String(SCAN_SKIP_WEEKEND),
  );
  const skipWeekend = skipWeekendRaw === "true";
  const skipWeekdaysStr = readEnvString(
    env,
    "SCAN_SKIP_WEEKDAYS",
    SCAN_SKIP_WEEKDAYS,
  );
  const skipWeekdays = skipWeekdaysStr
    ? skipWeekdaysStr.split(",").map((s) => parseInt(s.trim(), 10))
    : [];

  validateOffsets(startDateOffset, endDateOffset);
  validateSkipWeekdays(skipWeekdays);

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
    minPlaytimeHours,
  };
}

/**
 * Parses SCAN_* env vars into ScanCourtSlotsOptions.
 * Returns null when all specific dates are in the past.
 */
export function parseScanParams(
  env?: Record<string, string | undefined>,
): ScanCourtSlotsOptions | null {
  const specificDatesStr = readEnvString(
    env,
    "SCAN_SPECIFIC_DATES",
    SCAN_SPECIFIC_DATES,
  );
  const startHour = readEnvNumber(env, "SCAN_START_HOUR", SCAN_START_HOUR);
  const endHour = readEnvNumber(env, "SCAN_END_HOUR", SCAN_END_HOUR);
  const minPlaytimeHoursRaw =
    env !== undefined ? env["SCAN_MIN_PLAYTIME_HOURS"] : undefined;
  const minPlaytimeHours =
    minPlaytimeHoursRaw !== undefined && minPlaytimeHoursRaw !== ""
      ? Number(minPlaytimeHoursRaw)
      : SCAN_MIN_PLAYTIME_HOURS;

  validateHours(startHour, endHour);
  validateMinPlaytimeHours(minPlaytimeHours);

  if (specificDatesStr.trim() !== "") {
    return parseSpecificDates(
      specificDatesStr,
      env,
      startHour,
      endHour,
      minPlaytimeHours,
    );
  }

  return parseOffsetMode(env, startHour, endHour, minPlaytimeHours);
}
