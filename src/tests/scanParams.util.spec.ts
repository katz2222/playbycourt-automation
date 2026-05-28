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
