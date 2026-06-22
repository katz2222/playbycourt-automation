export function validateHours(startHour: number, endHour: number): void {
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
}

export function validateOffsets(
  startDateOffset: number,
  endDateOffset: number,
): void {
  if (startDateOffset < 0) {
    throw new Error(
      `SCAN_START_DATE_OFFSET must be a non-negative integer, got: ${startDateOffset}`,
    );
  }
  if (endDateOffset < 0) {
    throw new Error(
      `SCAN_END_DATE_OFFSET must be a non-negative integer, got: ${endDateOffset}`,
    );
  }
  if (startDateOffset > endDateOffset) {
    throw new Error(
      `SCAN_START_DATE_OFFSET (${startDateOffset}) must be less than or equal to SCAN_END_DATE_OFFSET (${endDateOffset})`,
    );
  }
}

export function validateSkipWeekdays(skipWeekdays: number[]): void {
  for (const day of skipWeekdays) {
    if (!Number.isInteger(day) || day < 0 || day > 6) {
      throw new Error(
        `SCAN_SKIP_WEEKDAYS contains invalid weekday number: ${day}. Must be 0-6`,
      );
    }
  }
}

export function findConflictingParams(
  env: Record<string, string | undefined> | undefined,
): string[] {
  const source = env !== undefined ? env : process.env;
  const conflicting: string[] = [];

  const startOffset = source["SCAN_START_DATE_OFFSET"];
  if (startOffset !== undefined && startOffset !== "") {
    conflicting.push("SCAN_START_DATE_OFFSET");
  }
  const endOffset = source["SCAN_END_DATE_OFFSET"];
  if (endOffset !== undefined && endOffset !== "") {
    conflicting.push("SCAN_END_DATE_OFFSET");
  }
  const skipWeekendVal = source["SCAN_SKIP_WEEKEND"];
  if (
    skipWeekendVal !== undefined &&
    skipWeekendVal !== "" &&
    skipWeekendVal !== "false"
  ) {
    conflicting.push("SCAN_SKIP_WEEKEND");
  }
  const skipWeekdaysVal = source["SCAN_SKIP_WEEKDAYS"];
  if (skipWeekdaysVal !== undefined && skipWeekdaysVal !== "") {
    conflicting.push("SCAN_SKIP_WEEKDAYS");
  }

  return conflicting;
}

export function parseDateToken(token: string): Date {
  const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!dateRegex.test(token)) {
    throw new Error(
      `Invalid date format in SCAN_SPECIFIC_DATES: "${token}". Expected DD/MM/YYYY`,
    );
  }

  const [dayStr, monthStr, yearStr] = token.split("/");
  const day = parseInt(dayStr, 10);
  const month = parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10);

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error(
      `Invalid calendar date in SCAN_SPECIFIC_DATES: "${token}". Date does not exist`,
    );
  }

  return date;
}
