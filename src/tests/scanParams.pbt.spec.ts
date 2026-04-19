import { test, expect } from "@playwright/test";
import fc from "fast-check";
import { parseScanParams } from "../utilities/scanParams.util";

/**
 * Property 1: Default round-trip
 * Calling parseScanParams({}) with no env vars returns valid ScanCourtSlotsOptions
 * with default values (startHour=10, endHour=19, skipWeekend=false, skipWeekdays=[]).
 *
 * **Validates: Requirements 1.2**
 */
test("Property 1: defaults are applied when no env vars are set", () => {
  const result = parseScanParams({});

  expect(result.startHour).toBe(10);
  expect(result.endHour).toBe(19);
  expect(result.skipWeekend).toBe(false);
  expect(result.skipWeekdays).toEqual([]);

  // startDate and endDate should be today + 1 day (default offset = 1)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expectedDate = new Date(today);
  expectedDate.setDate(expectedDate.getDate() + 1);

  expect(result.startDate.getTime()).toBe(expectedDate.getTime());
  expect(result.endDate.getTime()).toBe(expectedDate.getTime());
});

/**
 * Property 2: Valid hour ranges always produce startHour < endHour
 * For any SCAN_START_HOUR in [0,23] and SCAN_END_HOUR in [1,24] where start < end,
 * parseScanParams returns an object with startHour < endHour.
 *
 * **Validates: Requirements 2.1, 2.2, 2.3**
 */
test("Property 2: valid hour ranges always produce startHour < endHour", () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 23 }),
      fc.integer({ min: 1, max: 24 }),
      (startHour, endHour) => {
        fc.pre(startHour < endHour);

        const result = parseScanParams({
          SCAN_START_HOUR: String(startHour),
          SCAN_END_HOUR: String(endHour),
        });

        expect(result.startHour).toBe(startHour);
        expect(result.endHour).toBe(endHour);
        expect(result.startHour).toBeLessThan(result.endHour);
      },
    ),
    { numRuns: 100 },
  );
});

/**
 * Property 3: Invalid inputs always throw
 * For any SCAN_START_HOUR >= SCAN_END_HOUR, or negative offsets,
 * or weekday outside 0–6, parseScanParams throws an error.
 *
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**
 */
test("Property 3a: startHour >= endHour always throws", () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 23 }),
      fc.integer({ min: 1, max: 24 }),
      (startHour, endHour) => {
        fc.pre(startHour >= endHour);

        expect(() =>
          parseScanParams({
            SCAN_START_HOUR: String(startHour),
            SCAN_END_HOUR: String(endHour),
          }),
        ).toThrow();
      },
    ),
    { numRuns: 100 },
  );
});

test("Property 3b: negative start date offset always throws", () => {
  fc.assert(
    fc.property(fc.integer({ min: -1000, max: -1 }), (offset) => {
      expect(() =>
        parseScanParams({
          SCAN_START_DATE_OFFSET: String(offset),
          SCAN_END_DATE_OFFSET: "10",
        }),
      ).toThrow();
    }),
    { numRuns: 50 },
  );
});

test("Property 3c: negative end date offset always throws", () => {
  fc.assert(
    fc.property(fc.integer({ min: -1000, max: -1 }), (offset) => {
      expect(() =>
        parseScanParams({
          SCAN_END_DATE_OFFSET: String(offset),
        }),
      ).toThrow();
    }),
    { numRuns: 50 },
  );
});

test("Property 3d: weekday outside 0-6 always throws", () => {
  fc.assert(
    fc.property(
      fc.oneof(
        fc.integer({ min: -100, max: -1 }),
        fc.integer({ min: 7, max: 100 }),
      ),
      (invalidDay) => {
        expect(() =>
          parseScanParams({
            SCAN_SKIP_WEEKDAYS: String(invalidDay),
          }),
        ).toThrow();
      },
    ),
    { numRuns: 50 },
  );
});

/**
 * Property 4: Date offset consistency
 * For any valid SCAN_START_DATE_OFFSET <= SCAN_END_DATE_OFFSET,
 * the returned startDate <= endDate.
 *
 * **Validates: Requirements 1.3, 2.4, 2.5**
 */
test("Property 4: valid date offsets produce startDate <= endDate", () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 365 }),
      fc.integer({ min: 0, max: 365 }),
      (startOffset, endOffset) => {
        fc.pre(startOffset <= endOffset);

        const result = parseScanParams({
          SCAN_START_DATE_OFFSET: String(startOffset),
          SCAN_END_DATE_OFFSET: String(endOffset),
        });

        expect(result.startDate.getTime()).toBeLessThanOrEqual(
          result.endDate.getTime(),
        );
      },
    ),
    { numRuns: 100 },
  );
});
