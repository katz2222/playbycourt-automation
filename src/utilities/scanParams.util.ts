import {
  SCAN_START_DATE_OFFSET,
  SCAN_END_DATE_OFFSET,
  SCAN_START_HOUR,
  SCAN_END_HOUR,
  SCAN_SKIP_WEEKEND,
  SCAN_SKIP_WEEKDAYS,
  SCAN_SPECIFIC_DATES,
} from "../../env-variables";
import {
  readInt,
  readNumber,
  readString,
  readBool,
} from "@utils/envReaders.util";
import { ScanCourtSlotsOptions } from "./types.util";
import {
  validateHours,
  validateOffsets,
  validateSkipWeekdays,
  findConflictingParams,
  parseDateToken,
} from "./scanParamsValidation.util";

const DEFAULTS = {
  SCAN_START_DATE_OFFSET: 1,
  SCAN_END_DATE_OFFSET: 1,
  SCAN_START_HOUR: 10,
  SCAN_END_HOUR: 19,
  SCAN_SKIP_WEEKEND: false,
  SCAN_SKIP_WEEKDAYS: "",
  SCAN_SPECIFIC_DATES: "",
};

function parseSpecificDates(
  raw: string,
  env: Record<string, string | undefined> | undefined,
  startHour: number,
  endHour: number,
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
  return { specificDates: futureDates, startHour, endHour };
}

function parseOffsetMode(
  env: Record<string, string | undefined> | undefined,
  startHour: number,
  endHour: number,
): ScanCourtSlotsOptions {
  const startDateOffset = readInt(
    env,
    "SCAN_START_DATE_OFFSET",
    SCAN_START_DATE_OFFSET,
    DEFAULTS.SCAN_START_DATE_OFFSET,
  );
  const endDateOffset = readInt(
    env,
    "SCAN_END_DATE_OFFSET",
    SCAN_END_DATE_OFFSET,
    DEFAULTS.SCAN_END_DATE_OFFSET,
  );
  const skipWeekend = readBool(
    env,
    "SCAN_SKIP_WEEKEND",
    SCAN_SKIP_WEEKEND,
    DEFAULTS.SCAN_SKIP_WEEKEND,
  );
  const skipWeekdaysStr = readString(
    env,
    "SCAN_SKIP_WEEKDAYS",
    SCAN_SKIP_WEEKDAYS,
    DEFAULTS.SCAN_SKIP_WEEKDAYS,
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

  return { startDate, endDate, startHour, endHour, skipWeekend, skipWeekdays };
}

/**
 * Parses SCAN_* env vars into ScanCourtSlotsOptions.
 * Returns null when all specific dates are in the past.
 */
export function parseScanParams(
  env?: Record<string, string | undefined>,
): ScanCourtSlotsOptions | null {
  const specificDatesStr = readString(
    env,
    "SCAN_SPECIFIC_DATES",
    SCAN_SPECIFIC_DATES,
    DEFAULTS.SCAN_SPECIFIC_DATES,
  );
  const startHour = readNumber(
    env,
    "SCAN_START_HOUR",
    SCAN_START_HOUR,
    DEFAULTS.SCAN_START_HOUR,
  );
  const endHour = readNumber(
    env,
    "SCAN_END_HOUR",
    SCAN_END_HOUR,
    DEFAULTS.SCAN_END_HOUR,
  );

  validateHours(startHour, endHour);

  if (specificDatesStr.trim() !== "") {
    return parseSpecificDates(specificDatesStr, env, startHour, endHour);
  }

  return parseOffsetMode(env, startHour, endHour);
}
