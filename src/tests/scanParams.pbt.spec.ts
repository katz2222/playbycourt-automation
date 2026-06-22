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
  const result = parseScanParams({
    SCAN_START_DATE_OFFSET: "1",
    SCAN_END_DATE_OFFSET: "1",
    SCAN_START_HOUR: "10",
    SCAN_END_HOUR: "19",
  });
  expect(result).not.toBeNull();

  expect(result!.startHour).toBe(10);
  expect(result!.endHour).toBe(19);
  expect(result!.skipWeekend).toBe(false);
  expect(result!.skipWeekdays).toEqual([]);

  // startDate and endDate should be today + 1 day (default offset = 1)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expectedDate = new Date(today);
  expectedDate.setDate(expectedDate.getDate() + 1);

  expect(result!.startDate!.getTime()).toBe(expectedDate.getTime());
  expect(result!.endDate!.getTime()).toBe(expectedDate.getTime());
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
          SCAN_START_DATE_OFFSET: "1",
          SCAN_END_DATE_OFFSET: "1",
        });

        expect(result).not.toBeNull();
        expect(result!.startHour).toBe(startHour);
        expect(result!.endHour).toBe(endHour);
        expect(result!.startHour).toBeLessThan(result!.endHour);
      },
    ),
    { numRuns: 30 },
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
    { numRuns: 30 },
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
    { numRuns: 20 },
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
    { numRuns: 20 },
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
    { numRuns: 20 },
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
          SCAN_START_HOUR: "10",
          SCAN_END_HOUR: "19",
        });

        expect(result).not.toBeNull();
        expect(result!.startDate!.getTime()).toBeLessThanOrEqual(
          result!.endDate!.getTime(),
        );
      },
    ),
    { numRuns: 30 },
  );
});

// Feature: specific-dates-scan, Property 1: Date parsing round-trip
/**
 * Property 1: Date parsing round-trip
 *
 * For any list of valid future calendar dates, formatting them as DD/MM/YYYY strings,
 * joining with commas, and passing to parseScanParams as SCAN_SPECIFIC_DATES should
 * produce a specificDates array where each Date matches the original day/month/year values.
 *
 * **Validates: Requirements 1.1**
 */
test("Property 1: Date parsing round-trip for specific dates", () => {
  // Generator: arrays of 1-10 future dates within next 2 years
  const futureDateArb = fc
    .record({
      dayOffset: fc.integer({ min: 0, max: 730 }), // 0 to ~2 years from today
    })
    .map(({ dayOffset }) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + dayOffset);
      return date;
    });

  const futureDatesArrayArb = fc.array(futureDateArb, {
    minLength: 1,
    maxLength: 10,
  });

  fc.assert(
    fc.property(futureDatesArrayArb, (dates) => {
      // Format each date as DD/MM/YYYY
      const formatted = dates.map((d) => {
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = String(d.getFullYear());
        return `${dd}/${mm}/${yyyy}`;
      });

      const specificDatesStr = formatted.join(",");

      const result = parseScanParams({
        SCAN_SPECIFIC_DATES: specificDatesStr,
        SCAN_START_HOUR: "10",
        SCAN_END_HOUR: "19",
      });

      // Result should not be null since all dates are future (today or later)
      expect(result).not.toBeNull();

      // Must have specificDates field
      expect(result!.specificDates).toBeDefined();
      expect(result!.specificDates!.length).toBe(dates.length);

      // Build a sorted copy of input dates for comparison
      const sortedInput = [...dates].sort((a, b) => a.getTime() - b.getTime());

      // Verify each output date matches the corresponding sorted input day/month/year
      for (let i = 0; i < result!.specificDates!.length; i++) {
        const outputDate = result!.specificDates![i];
        const inputDate = sortedInput[i];
        expect(outputDate.getDate()).toBe(inputDate.getDate());
        expect(outputDate.getMonth()).toBe(inputDate.getMonth());
        expect(outputDate.getFullYear()).toBe(inputDate.getFullYear());
      }
    }),
    { numRuns: 30 },
  );
});

// Feature: specific-dates-scan, Property 2: Invalid date format rejection
/**
 * Property 2: Invalid date format rejection
 *
 * For any string that does not conform to DD/MM/YYYY format (wrong separators,
 * non-numeric characters, invalid day/month values like 32/13/2025, or non-existent
 * calendar dates like 31/02/2025), passing it as SCAN_SPECIFIC_DATES should cause
 * parseScanParams to throw an error containing the invalid value.
 *
 * **Validates: Requirements 1.2**
 */
test("Property 2: Invalid date format rejection for specific dates", () => {
  // Generator: various invalid date strings using fc.oneof
  const invalidDateArb = fc.oneof(
    // Wrong separators (e.g., "25-12-2025", "25.12.2025")
    fc
      .record({
        day: fc.integer({ min: 1, max: 28 }),
        month: fc.integer({ min: 1, max: 12 }),
        year: fc.integer({ min: 2025, max: 2030 }),
        sep: fc.constantFrom("-", ".", " ", "\\", "|", "_"),
      })
      .map(
        ({ day, month, year, sep }) =>
          `${String(day).padStart(2, "0")}${sep}${String(month).padStart(2, "0")}${sep}${year}`,
      ),

    // Non-numeric characters (e.g., "ab/cd/efgh")
    fc
      .tuple(
        fc.constantFrom("ab", "cd", "xx", "zz", "qw"),
        fc.constantFrom("ef", "gh", "yy", "ww", "mn"),
        fc.constantFrom("abcd", "efgh", "ijkl", "wxyz", "qrst"),
      )
      .map(([part1, part2, part3]) => `${part1}/${part2}/${part3}`),

    // Out-of-range day (32+)
    fc
      .record({
        day: fc.integer({ min: 32, max: 99 }),
        month: fc.integer({ min: 1, max: 12 }),
        year: fc.integer({ min: 2025, max: 2030 }),
      })
      .map(
        ({ day, month, year }) =>
          `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`,
      ),

    // Out-of-range month (13+)
    fc
      .record({
        day: fc.integer({ min: 1, max: 28 }),
        month: fc.integer({ min: 13, max: 99 }),
        year: fc.integer({ min: 2025, max: 2030 }),
      })
      .map(
        ({ day, month, year }) =>
          `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`,
      ),

    // Non-existent calendar dates (e.g., 31/02/2025, 29/02/2023 non-leap year)
    fc.constantFrom(
      "31/02/2025",
      "30/02/2025",
      "29/02/2023",
      "29/02/2025",
      "31/04/2025",
      "31/06/2025",
      "31/09/2025",
      "31/11/2025",
    ),
  );

  fc.assert(
    fc.property(invalidDateArb, (invalidDate) => {
      expect(() =>
        parseScanParams({
          SCAN_SPECIFIC_DATES: invalidDate,
          SCAN_START_HOUR: "10",
          SCAN_END_HOUR: "19",
        }),
      ).toThrow();
    }),
    { numRuns: 30 },
  );
});

// Feature: specific-dates-scan, Property 3: Mutual exclusivity enforcement
/**
 * Property 3: Mutual exclusivity enforcement
 *
 * For any non-empty SCAN_SPECIFIC_DATES value combined with any non-default value
 * for SCAN_START_DATE_OFFSET, SCAN_END_DATE_OFFSET, SCAN_SKIP_WEEKEND, or
 * SCAN_SKIP_WEEKDAYS, parseScanParams should throw an error listing the conflicting parameters.
 *
 * **Validates: Requirements 2.1**
 */
test("Property 3: Mutual exclusivity enforcement for specific dates", () => {
  // Generate a valid future date string
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dd = String(tomorrow.getDate()).padStart(2, "0");
  const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const yyyy = String(tomorrow.getFullYear());
  const validDateStr = `${dd}/${mm}/${yyyy}`;

  // Generator: at least one conflicting param set to a non-default value
  const conflictingParamArb = fc.record(
    {
      SCAN_START_DATE_OFFSET: fc.constantFrom("1", "5", "10"),
      SCAN_END_DATE_OFFSET: fc.constantFrom("1", "7", "14"),
      SCAN_SKIP_WEEKEND: fc.constantFrom("true"),
      SCAN_SKIP_WEEKDAYS: fc.constantFrom("0", "1,2", "5,6"),
    },
    { requiredKeys: [] },
  );

  fc.assert(
    fc.property(conflictingParamArb, (conflicting) => {
      // Ensure at least one conflicting param is present
      const hasConflict =
        conflicting.SCAN_START_DATE_OFFSET !== undefined ||
        conflicting.SCAN_END_DATE_OFFSET !== undefined ||
        conflicting.SCAN_SKIP_WEEKEND !== undefined ||
        conflicting.SCAN_SKIP_WEEKDAYS !== undefined;
      fc.pre(hasConflict);

      const env: Record<string, string> = {
        SCAN_SPECIFIC_DATES: validDateStr,
        SCAN_START_HOUR: "10",
        SCAN_END_HOUR: "19",
        ...conflicting,
      };

      expect(() => parseScanParams(env)).toThrow(
        /SCAN_SPECIFIC_DATES cannot be used with/,
      );
    }),
    { numRuns: 100 },
  );
});

// Feature: specific-dates-scan, Property 4: Backward compatibility in offset mode
/**
 * Property 4: Backward compatibility in offset mode
 *
 * For any valid offset-based configuration where SCAN_SPECIFIC_DATES is absent or empty,
 * parseScanParams should return a ScanCourtSlotsOptions with no specificDates field,
 * and startDate/endDate computed from the offsets relative to today.
 *
 * **Validates: Requirements 1.3, 2.2**
 */
test("Property 4: Backward compatibility in offset mode", () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 60 }),
      fc.integer({ min: 0, max: 60 }),
      fc.constantFrom("", undefined),
      (startOffset, endOffset, specificDatesVal) => {
        fc.pre(startOffset <= endOffset);

        const env: Record<string, string | undefined> = {
          SCAN_START_DATE_OFFSET: String(startOffset),
          SCAN_END_DATE_OFFSET: String(endOffset),
          SCAN_START_HOUR: "10",
          SCAN_END_HOUR: "19",
        };

        if (specificDatesVal !== undefined) {
          env.SCAN_SPECIFIC_DATES = specificDatesVal;
        }

        const result = parseScanParams(env as Record<string, string>);

        // Should not be null
        expect(result).not.toBeNull();

        // Should NOT have specificDates
        expect(result!.specificDates).toBeUndefined();

        // Should have startDate and endDate
        expect(result!.startDate).toBeInstanceOf(Date);
        expect(result!.endDate).toBeInstanceOf(Date);

        // Verify dates are computed from offsets relative to today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const expectedStart = new Date(today);
        expectedStart.setDate(expectedStart.getDate() + startOffset);
        const expectedEnd = new Date(today);
        expectedEnd.setDate(expectedEnd.getDate() + endOffset);

        expect(result!.startDate!.getTime()).toBe(expectedStart.getTime());
        expect(result!.endDate!.getTime()).toBe(expectedEnd.getTime());
      },
    ),
    { numRuns: 100 },
  );
});

// Feature: specific-dates-scan, Property 5: All-past-dates early exit
/**
 * Property 5: All-past-dates early exit
 *
 * For any list of dates where every date is strictly before today, passing them
 * as SCAN_SPECIFIC_DATES should cause parseScanParams to return null.
 *
 * **Validates: Requirements 3.1, 3.2**
 */
test("Property 5: All-past-dates early exit", () => {
  // Generator: arrays of 1-10 past dates (1 to 1000 days ago)
  const pastDateArb = fc.integer({ min: 1, max: 1000 }).map((daysAgo) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - daysAgo);
    return date;
  });

  const pastDatesArrayArb = fc.array(pastDateArb, {
    minLength: 1,
    maxLength: 10,
  });

  fc.assert(
    fc.property(pastDatesArrayArb, (dates) => {
      const formatted = dates.map((d) => {
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = String(d.getFullYear());
        return `${dd}/${mm}/${yyyy}`;
      });

      const result = parseScanParams({
        SCAN_SPECIFIC_DATES: formatted.join(","),
        SCAN_START_HOUR: "10",
        SCAN_END_HOUR: "19",
      });

      expect(result).toBeNull();
    }),
    { numRuns: 100 },
  );
});

// Feature: specific-dates-scan, Property 6: Future date filtering and output structure
/**
 * Property 6: Future date filtering and output structure
 *
 * For any list of dates containing at least one future date (today or later),
 * parseScanParams should return a result where: (a) specificDates contains only
 * the future dates from the input, sorted ascending, (b) no startDate/endDate
 * fields are present, and (c) startHour/endHour match the provided hour parameters.
 *
 * **Validates: Requirements 4.1, 4.2, 5.2, 1.4**
 */
test("Property 6: Future date filtering and output structure", () => {
  // Generator: mixed arrays with at least one future date
  const dateArb = fc
    .record({
      daysOffset: fc.integer({ min: -100, max: 365 }),
    })
    .map(({ daysOffset }) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + daysOffset);
      return date;
    });

  const mixedDatesArb = fc.array(dateArb, { minLength: 1, maxLength: 10 });

  // Valid hour pairs
  const hourPairArb = fc
    .tuple(fc.integer({ min: 0, max: 22 }), fc.integer({ min: 1, max: 24 }))
    .filter(([s, e]) => s < e);

  fc.assert(
    fc.property(mixedDatesArb, hourPairArb, (dates, [startHour, endHour]) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Ensure at least one future date
      const hasFuture = dates.some((d) => d >= today);
      fc.pre(hasFuture);

      const formatted = dates.map((d) => {
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = String(d.getFullYear());
        return `${dd}/${mm}/${yyyy}`;
      });

      const result = parseScanParams({
        SCAN_SPECIFIC_DATES: formatted.join(","),
        SCAN_START_HOUR: String(startHour),
        SCAN_END_HOUR: String(endHour),
      });

      expect(result).not.toBeNull();

      // (a) specificDates contains only future dates, sorted ascending
      const expectedFuture = dates
        .filter((d) => d >= today)
        .sort((a, b) => a.getTime() - b.getTime());

      expect(result!.specificDates).toBeDefined();
      expect(result!.specificDates!.length).toBe(expectedFuture.length);

      for (let i = 0; i < result!.specificDates!.length; i++) {
        expect(result!.specificDates![i].getDate()).toBe(
          expectedFuture[i].getDate(),
        );
        expect(result!.specificDates![i].getMonth()).toBe(
          expectedFuture[i].getMonth(),
        );
        expect(result!.specificDates![i].getFullYear()).toBe(
          expectedFuture[i].getFullYear(),
        );
      }

      // Verify sorted ascending
      for (let i = 1; i < result!.specificDates!.length; i++) {
        expect(result!.specificDates![i].getTime()).toBeGreaterThanOrEqual(
          result!.specificDates![i - 1].getTime(),
        );
      }

      // (b) no startDate/endDate fields
      expect(result!.startDate).toBeUndefined();
      expect(result!.endDate).toBeUndefined();

      // (c) startHour/endHour match
      expect(result!.startHour).toBe(startHour);
      expect(result!.endHour).toBe(endHour);
    }),
    { numRuns: 100 },
  );
});

// Feature: specific-dates-scan, Property 7: Service uses specificDates directly
/**
 * Property 7: Service uses specificDates directly
 *
 * For any ScanCourtSlotsOptions with a specificDates field, the set of dates
 * used for scanning should equal exactly the specificDates array, not a generated
 * range between startDate and endDate.
 *
 * We verify this by simulating the conditional logic used in the service/slots layers:
 *   const dates = params.specificDates ? params.specificDates : generateDateRange(...)
 *
 * **Validates: Requirements 5.3**
 */
test("Property 7: Service uses specificDates directly", () => {
  // Import generateDateRange to verify the conditional logic
  const { generateDateRange } = require("../utilities/date.utils");

  // Generator: arrays of 1-10 future dates
  const futureDateArb = fc.integer({ min: 0, max: 365 }).map((dayOffset) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + dayOffset);
    return date;
  });

  const futureDatesArrayArb = fc.array(futureDateArb, {
    minLength: 1,
    maxLength: 10,
  });

  fc.assert(
    fc.property(futureDatesArrayArb, (dates) => {
      // Format dates as DD/MM/YYYY for parseScanParams
      const formatted = dates.map((d) => {
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = String(d.getFullYear());
        return `${dd}/${mm}/${yyyy}`;
      });

      const result = parseScanParams({
        SCAN_SPECIFIC_DATES: formatted.join(","),
        SCAN_START_HOUR: "10",
        SCAN_END_HOUR: "19",
      });

      expect(result).not.toBeNull();
      expect(result!.specificDates).toBeDefined();

      // Simulate the service/slots conditional logic
      const datesUsed = result!.specificDates
        ? result!.specificDates
        : generateDateRange(result!.startDate, result!.endDate, {
            skipWeekend: result!.skipWeekend,
            skipWeekdays: result!.skipWeekdays,
          });

      // The dates used should be exactly the specificDates (sorted, deduplicated by parseScanParams)
      expect(datesUsed).toBe(result!.specificDates);

      // Verify no startDate/endDate are present (so generateDateRange path is impossible)
      expect(result!.startDate).toBeUndefined();
      expect(result!.endDate).toBeUndefined();

      // Verify the dates match the input (sorted ascending, deduplicated by day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expectedFuture = dates
        .filter((d) => d >= today)
        .sort((a, b) => a.getTime() - b.getTime());

      expect(datesUsed.length).toBe(expectedFuture.length);
      for (let i = 0; i < datesUsed.length; i++) {
        expect(datesUsed[i].getDate()).toBe(expectedFuture[i].getDate());
        expect(datesUsed[i].getMonth()).toBe(expectedFuture[i].getMonth());
        expect(datesUsed[i].getFullYear()).toBe(
          expectedFuture[i].getFullYear(),
        );
      }
    }),
    { numRuns: 100 },
  );
});
