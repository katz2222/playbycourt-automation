import { test, expect } from "@playwright/test";
import { parseScanParams } from "../utilities/scanParams.util";

// Helper: returns a valid env object with all defaults overridden
function validEnv(
  overrides: Record<string, string> = {},
): Record<string, string> {
  return {
    SCAN_START_HOUR: "10",
    SCAN_END_HOUR: "19",
    SCAN_START_DATE_OFFSET: "1",
    SCAN_END_DATE_OFFSET: "1",
    ...overrides,
  };
}

// --- SCAN_START_HOUR validation ---

test("throws when SCAN_START_HOUR is not a number", () => {
  expect(() => parseScanParams(validEnv({ SCAN_START_HOUR: "abc" }))).toThrow(
    /SCAN_START_HOUR must be a number between 0 and 23\.5/,
  );
});

test("throws when SCAN_START_HOUR is below 0", () => {
  expect(() => parseScanParams(validEnv({ SCAN_START_HOUR: "-1" }))).toThrow(
    /SCAN_START_HOUR must be a number between 0 and 23\.5/,
  );
});

test("throws when SCAN_START_HOUR is above 23.5", () => {
  expect(() => parseScanParams(validEnv({ SCAN_START_HOUR: "24" }))).toThrow(
    /SCAN_START_HOUR must be a number between 0 and 23\.5/,
  );
});

// --- SCAN_END_HOUR validation ---

test("throws when SCAN_END_HOUR is not a number", () => {
  expect(() => parseScanParams(validEnv({ SCAN_END_HOUR: "xyz" }))).toThrow(
    /SCAN_END_HOUR must be a number between 0\.5 and 24/,
  );
});

test("throws when SCAN_END_HOUR is below 0.5", () => {
  expect(() => parseScanParams(validEnv({ SCAN_END_HOUR: "0" }))).toThrow(
    /SCAN_END_HOUR must be a number between 0\.5 and 24/,
  );
});

test("throws when SCAN_END_HOUR is above 24", () => {
  expect(() => parseScanParams(validEnv({ SCAN_END_HOUR: "25" }))).toThrow(
    /SCAN_END_HOUR must be a number between 0\.5 and 24/,
  );
});

// --- start < end hour validation ---

test("throws when SCAN_START_HOUR >= SCAN_END_HOUR", () => {
  expect(() =>
    parseScanParams(validEnv({ SCAN_START_HOUR: "19", SCAN_END_HOUR: "10" })),
  ).toThrow(/SCAN_START_HOUR.*must be less than.*SCAN_END_HOUR/);
});

test("throws when SCAN_START_HOUR equals SCAN_END_HOUR", () => {
  expect(() =>
    parseScanParams(validEnv({ SCAN_START_HOUR: "12", SCAN_END_HOUR: "12" })),
  ).toThrow(/SCAN_START_HOUR.*must be less than.*SCAN_END_HOUR/);
});

// --- Offset validation ---

test("throws when SCAN_START_DATE_OFFSET is negative", () => {
  expect(() =>
    parseScanParams(validEnv({ SCAN_START_DATE_OFFSET: "-1" })),
  ).toThrow(/SCAN_START_DATE_OFFSET must be a non-negative integer/);
});

test("throws when SCAN_END_DATE_OFFSET is not an integer", () => {
  expect(() =>
    parseScanParams(validEnv({ SCAN_END_DATE_OFFSET: "1.5" })),
  ).toThrow(/SCAN_END_DATE_OFFSET must be a non-negative integer/);
});

test("throws when SCAN_START_DATE_OFFSET > SCAN_END_DATE_OFFSET", () => {
  expect(() =>
    parseScanParams(
      validEnv({ SCAN_START_DATE_OFFSET: "5", SCAN_END_DATE_OFFSET: "2" }),
    ),
  ).toThrow(
    /SCAN_START_DATE_OFFSET.*must be less than or equal to.*SCAN_END_DATE_OFFSET/,
  );
});

// --- Skip weekdays validation ---

test("throws when SCAN_SKIP_WEEKDAYS contains value > 6", () => {
  expect(() =>
    parseScanParams(validEnv({ SCAN_SKIP_WEEKDAYS: "0,7" })),
  ).toThrow(/SCAN_SKIP_WEEKDAYS contains invalid weekday number/);
});

test("throws when SCAN_SKIP_WEEKDAYS contains negative value", () => {
  expect(() =>
    parseScanParams(validEnv({ SCAN_SKIP_WEEKDAYS: "-1,3" })),
  ).toThrow(/SCAN_SKIP_WEEKDAYS contains invalid weekday number/);
});

test("throws when SCAN_SKIP_WEEKDAYS contains non-integer", () => {
  expect(() =>
    parseScanParams(validEnv({ SCAN_SKIP_WEEKDAYS: "abc" })),
  ).toThrow(/SCAN_SKIP_WEEKDAYS contains invalid weekday number/);
});

// --- Valid inputs should not throw ---

test("accepts valid parameters without throwing", () => {
  const result = parseScanParams(
    validEnv({
      SCAN_START_HOUR: "8",
      SCAN_END_HOUR: "20",
      SCAN_START_DATE_OFFSET: "0",
      SCAN_END_DATE_OFFSET: "7",
      SCAN_SKIP_WEEKDAYS: "0,6",
    }),
  );
  expect(result.startHour).toBe(8);
  expect(result.endHour).toBe(20);
  expect(result.skipWeekdays).toEqual([0, 6]);
});

test("accepts boundary values: startHour=0, endHour=24", () => {
  const result = parseScanParams(
    validEnv({ SCAN_START_HOUR: "0", SCAN_END_HOUR: "24" }),
  );
  expect(result.startHour).toBe(0);
  expect(result.endHour).toBe(24);
});

test("accepts half-hour values like 19.5 for 19:30", () => {
  const result = parseScanParams(
    validEnv({ SCAN_START_HOUR: "17.5", SCAN_END_HOUR: "19.5" }),
  );
  expect(result.startHour).toBe(17.5);
  expect(result.endHour).toBe(19.5);
});

// --- Specific dates mode tests ---

test("parses '25/12/2026,01/01/2027' into correct Date objects", () => {
  const result = parseScanParams({
    SCAN_SPECIFIC_DATES: "25/12/2026,01/01/2027",
    SCAN_START_HOUR: "10",
    SCAN_END_HOUR: "19",
  });

  expect(result).not.toBeNull();
  expect(result!.specificDates).toBeDefined();
  expect(result!.specificDates!.length).toBe(2);
  expect(result!.specificDates![0].getDate()).toBe(25);
  expect(result!.specificDates![0].getMonth()).toBe(11); // December = 11
  expect(result!.specificDates![0].getFullYear()).toBe(2026);
  expect(result!.specificDates![1].getDate()).toBe(1);
  expect(result!.specificDates![1].getMonth()).toBe(0); // January = 0
  expect(result!.specificDates![1].getFullYear()).toBe(2027);
});

test("throws on invalid calendar date '31/02/2025'", () => {
  expect(() =>
    parseScanParams({
      SCAN_SPECIFIC_DATES: "31/02/2025",
      SCAN_START_HOUR: "10",
      SCAN_END_HOUR: "19",
    }),
  ).toThrow(/Invalid calendar date.*31\/02\/2025/);
});

test("mutual exclusivity error lists conflicting params", () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dd = String(tomorrow.getDate()).padStart(2, "0");
  const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const yyyy = String(tomorrow.getFullYear());

  expect(() =>
    parseScanParams({
      SCAN_SPECIFIC_DATES: `${dd}/${mm}/${yyyy}`,
      SCAN_START_HOUR: "10",
      SCAN_END_HOUR: "19",
      SCAN_START_DATE_OFFSET: "1",
      SCAN_SKIP_WEEKEND: "true",
    }),
  ).toThrow(/SCAN_SPECIFIC_DATES cannot be used with.*SCAN_START_DATE_OFFSET/);
});

test("parses single date in SCAN_SPECIFIC_DATES", () => {
  const result = parseScanParams({
    SCAN_SPECIFIC_DATES: "15/06/2027",
    SCAN_START_HOUR: "10",
    SCAN_END_HOUR: "19",
  });

  expect(result).not.toBeNull();
  expect(result!.specificDates).toBeDefined();
  expect(result!.specificDates!.length).toBe(1);
  expect(result!.specificDates![0].getDate()).toBe(15);
  expect(result!.specificDates![0].getMonth()).toBe(5); // June = 5
  expect(result!.specificDates![0].getFullYear()).toBe(2027);
});

test("handles dates with extra whitespace around commas", () => {
  const result = parseScanParams({
    SCAN_SPECIFIC_DATES: " 25/12/2026 , 01/01/2027 , 15/06/2027 ",
    SCAN_START_HOUR: "10",
    SCAN_END_HOUR: "19",
  });

  expect(result).not.toBeNull();
  expect(result!.specificDates).toBeDefined();
  expect(result!.specificDates!.length).toBe(3);
});

test("empty string treated as absent (offset mode)", () => {
  const result = parseScanParams({
    SCAN_SPECIFIC_DATES: "",
    SCAN_START_HOUR: "10",
    SCAN_END_HOUR: "19",
    SCAN_START_DATE_OFFSET: "1",
    SCAN_END_DATE_OFFSET: "5",
  });

  expect(result).not.toBeNull();
  expect(result!.specificDates).toBeUndefined();
  expect(result!.startDate).toBeInstanceOf(Date);
  expect(result!.endDate).toBeInstanceOf(Date);
});

test("all dates are today (should be included as future)", () => {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = String(today.getFullYear());

  const result = parseScanParams({
    SCAN_SPECIFIC_DATES: `${dd}/${mm}/${yyyy}`,
    SCAN_START_HOUR: "10",
    SCAN_END_HOUR: "19",
  });

  expect(result).not.toBeNull();
  expect(result!.specificDates).toBeDefined();
  expect(result!.specificDates!.length).toBe(1);
  expect(result!.specificDates![0].getDate()).toBe(today.getDate());
  expect(result!.specificDates![0].getMonth()).toBe(today.getMonth());
  expect(result!.specificDates![0].getFullYear()).toBe(today.getFullYear());
});
