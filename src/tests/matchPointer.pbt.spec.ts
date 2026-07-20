import { test, expect } from "@playwright/test";
import fc from "fast-check";
import {
  deriveAvailableSlots,
  getOpeningHoursForDate,
  filterByMinPlaytime,
  filterByHourRange,
} from "@utils/matchPointerSlots.util";
import {
  parseHourStringToDecimal,
  formatHourDecimalToTimeString,
} from "@utils/date.utils";
import { TimeRange, DayTimeRange } from "@utils/types.util";
import {
  fetchVenueDetails,
  fetchActiveCourts,
} from "@utils/matchPointerApi.util";

// Feature: multi-club-scanning, Property 4: Availability derivation correctness
/**
 * Property 4: Availability derivation correctness
 *
 * For any set of opening hour ranges and any set of reservations within those ranges,
 * deriveAvailableSlots should produce time ranges where:
 * (a) no derived range overlaps with any reservation,
 * (b) all derived ranges fall within the original opening hours, and
 * (c) the sum of derived durations plus reservation durations equals the total opening hours duration.
 *
 * **Validates: Requirements 5.3, 5.2, 5.4, 4.3, 10.2**
 */
test("Property 4: Availability derivation correctness", () => {
  // Generator: sorted non-overlapping opening hour ranges between 6 and 22
  const openingRangesArb = fc
    .array(fc.integer({ min: 6, max: 18 }), { minLength: 1, maxLength: 3 })
    .map((starts) => {
      // Sort and deduplicate
      const sorted = [...new Set(starts)].sort((a, b) => a - b);
      const ranges: { startDec: number; endDec: number }[] = [];
      for (const s of sorted) {
        const maxEnd = Math.min(s + 4, 22);
        if (maxEnd <= s) continue;
        // Ensure no overlap with previous range
        if (ranges.length > 0 && s < ranges[ranges.length - 1].endDec) continue;
        const end = Math.min(s + 2, maxEnd); // each range is 2 hours
        ranges.push({ startDec: s, endDec: end });
      }
      if (ranges.length === 0) {
        ranges.push({ startDec: 8, endDec: 10 });
      }
      return ranges;
    })
    .chain((ranges) => {
      // Generate reservations within those ranges
      const reservationArbs = ranges.map((range) => {
        const duration = range.endDec - range.startDec;
        if (duration <= 0.5) {
          return fc.constant([] as { startDec: number; endDec: number }[]);
        }
        return fc
          .array(
            fc.record({
              offsetStart: fc.double({
                min: 0,
                max: duration - 0.5,
                noNaN: true,
              }),
              resDuration: fc.double({ min: 0.5, max: 1.5, noNaN: true }),
            }),
            { minLength: 0, maxLength: 2 },
          )
          .map((raws) => {
            // Build non-overlapping reservations within this range
            const reservations: { startDec: number; endDec: number }[] = [];
            const sorted = raws.sort((a, b) => a.offsetStart - b.offsetStart);
            for (const raw of sorted) {
              const resStart = range.startDec + raw.offsetStart;
              const resEnd = Math.min(resStart + raw.resDuration, range.endDec);
              if (resEnd <= resStart) continue;
              // Ensure no overlap with previous reservation
              if (
                reservations.length > 0 &&
                resStart < reservations[reservations.length - 1].endDec
              ) {
                continue;
              }
              reservations.push({ startDec: resStart, endDec: resEnd });
            }
            return reservations;
          });
      });

      return fc.tuple(fc.constant(ranges), ...reservationArbs);
    })
    .map(([ranges, ...reservationArrays]) => {
      const openingRanges: TimeRange[] = ranges.map((r) => ({
        start: formatHourDecimalToTimeString(r.startDec),
        end: formatHourDecimalToTimeString(r.endDec),
      }));
      const reservations: TimeRange[] = (
        reservationArrays as { startDec: number; endDec: number }[][]
      )
        .flat()
        .map((r) => ({
          start: formatHourDecimalToTimeString(r.startDec),
          end: formatHourDecimalToTimeString(r.endDec),
        }));
      return { openingRanges, reservations };
    });

  fc.assert(
    fc.property(openingRangesArb, ({ openingRanges, reservations }) => {
      const derived = deriveAvailableSlots(openingRanges, reservations);

      // (a) No derived range overlaps with any reservation
      for (const slot of derived) {
        const slotStart = parseHourStringToDecimal(slot.start);
        const slotEnd = parseHourStringToDecimal(slot.end);
        for (const res of reservations) {
          const resStart = parseHourStringToDecimal(res.start);
          const resEnd = parseHourStringToDecimal(res.end);
          // Overlap: slotStart < resEnd && slotEnd > resStart
          expect(slotStart >= resEnd || slotEnd <= resStart).toBe(true);
        }
      }

      // (b) All derived ranges fall within the original opening hours
      for (const slot of derived) {
        const slotStart = parseHourStringToDecimal(slot.start);
        const slotEnd = parseHourStringToDecimal(slot.end);
        const withinSomeRange = openingRanges.some((range) => {
          const rangeStart = parseHourStringToDecimal(range.start);
          const rangeEnd = parseHourStringToDecimal(range.end);
          return slotStart >= rangeStart - 0.001 && slotEnd <= rangeEnd + 0.001;
        });
        expect(withinSomeRange).toBe(true);
      }

      // (c) Sum of derived durations + reservation durations = total opening hours duration
      const totalOpeningDuration = openingRanges.reduce((sum, r) => {
        return (
          sum +
          parseHourStringToDecimal(r.end) -
          parseHourStringToDecimal(r.start)
        );
      }, 0);

      const totalDerivedDuration = derived.reduce((sum, s) => {
        return (
          sum +
          parseHourStringToDecimal(s.end) -
          parseHourStringToDecimal(s.start)
        );
      }, 0);

      // Only count reservations that actually overlap with opening ranges
      const totalReservationDuration = reservations.reduce((sum, res) => {
        const resStart = parseHourStringToDecimal(res.start);
        const resEnd = parseHourStringToDecimal(res.end);
        let clippedDuration = 0;
        for (const range of openingRanges) {
          const rangeStart = parseHourStringToDecimal(range.start);
          const rangeEnd = parseHourStringToDecimal(range.end);
          const overlapStart = Math.max(resStart, rangeStart);
          const overlapEnd = Math.min(resEnd, rangeEnd);
          if (overlapEnd > overlapStart) {
            clippedDuration += overlapEnd - overlapStart;
          }
        }
        return sum + clippedDuration;
      }, 0);

      expect(totalDerivedDuration + totalReservationDuration).toBeCloseTo(
        totalOpeningDuration,
        5,
      );
    }),
    { numRuns: 20 },
  );
});

// Feature: multi-club-scanning, Property 5: Closed day returns no slots
/**
 * Property 5: Closed day returns no slots
 *
 * For any opening hours configuration where a day's isOpen is false,
 * deriving availability for a date that falls on that day-of-week should
 * always return an empty array regardless of what reservations exist.
 *
 * **Validates: Requirements 5.5**
 */
test("Property 5: Closed day returns no slots", () => {
  // Generator: a random day (0-6) that will be closed
  const closedDayArb = fc.integer({ min: 0, max: 6 });

  // Generator: opening hours array with the chosen day closed
  const openingHoursArb = closedDayArb.map((closedDay) => {
    const openingHours: DayTimeRange[] = [];
    for (let day = 0; day < 7; day++) {
      if (day === closedDay) {
        openingHours.push({ day, isOpen: false, ranges: [] });
      } else {
        openingHours.push({
          day,
          isOpen: true,
          ranges: [{ start: "08:00", end: "22:00" }],
        });
      }
    }
    return { openingHours, closedDay };
  });

  fc.assert(
    fc.property(openingHoursArb, ({ openingHours, closedDay }) => {
      // Create a date that falls on the closed day
      // Start from a known reference and find the next occurrence
      const refDate = new Date(2024, 0, 1); // Jan 1, 2024 (Monday = 1)
      const refDay = refDate.getDay();
      const daysToAdd = (closedDay - refDay + 7) % 7;
      const targetDate = new Date(2024, 0, 1 + daysToAdd);

      const result = getOpeningHoursForDate(targetDate, openingHours);
      expect(result).toEqual([]);
    }),
    { numRuns: 20 },
  );
});

// Feature: multi-club-scanning, Property 6: Day-of-week to opening hours mapping
/**
 * Property 6: Day-of-week to opening hours mapping
 *
 * For any date and any opening hours configuration, the system should look up the
 * time ranges corresponding to that date's day-of-week (0=Sunday through 6=Saturday)
 * and return exactly those ranges.
 *
 * **Validates: Requirements 5.1**
 */
test("Property 6: Day-of-week to opening hours mapping", () => {
  // Generator: opening hours array with distinct ranges per day
  const openingHoursArb = fc
    .array(
      fc.record({
        isOpen: fc.boolean(),
        rangeCount: fc.integer({ min: 1, max: 2 }),
        startHour: fc.integer({ min: 6, max: 12 }),
      }),
      { minLength: 7, maxLength: 7 },
    )
    .map((dayConfigs) => {
      return dayConfigs.map((config, day) => {
        if (!config.isOpen) {
          return { day, isOpen: false, ranges: [] } as DayTimeRange;
        }
        const ranges: TimeRange[] = [];
        for (let i = 0; i < config.rangeCount; i++) {
          const start = config.startHour + i * 5;
          const end = start + 2;
          if (end <= 22) {
            ranges.push({
              start: formatHourDecimalToTimeString(start),
              end: formatHourDecimalToTimeString(end),
            });
          }
        }
        return { day, isOpen: true, ranges } as DayTimeRange;
      });
    });

  // Generator: a random date
  const dateArb = fc
    .integer({ min: 0, max: 364 })
    .map((offset) => new Date(2024, 0, 1 + offset));

  fc.assert(
    fc.property(openingHoursArb, dateArb, (openingHours, date) => {
      const result = getOpeningHoursForDate(date, openingHours);
      const expectedDay = date.getDay();
      const expectedConfig = openingHours.find((d) => d.day === expectedDay);

      if (!expectedConfig || !expectedConfig.isOpen) {
        expect(result).toEqual([]);
      } else {
        expect(result).toEqual(expectedConfig.ranges);
      }
    }),
    { numRuns: 20 },
  );
});

// Feature: multi-club-scanning, Property 7: Minimum playtime filter invariant
/**
 * Property 7: Minimum playtime filter invariant
 *
 * For any list of time slots and any minPlaytimeHours value, after applying the
 * minimum playtime filter, all remaining slots should have (end - start) >= minPlaytimeHours,
 * and no slot with sufficient duration should be removed.
 *
 * **Validates: Requirements 6.2, 6.3**
 */
test("Property 7: Minimum playtime filter invariant", () => {
  const validDurations = [1, 1.5, 2];

  // Generator: random TimeRange arrays with varying durations
  const timeRangeArb = fc
    .record({
      startHour: fc.integer({ min: 6, max: 20 }),
      durationHours: fc.constantFrom(1, 1.5, 2, 2.5, 3, 3.5, 4),
    })
    .map(({ startHour, durationHours }) => {
      const endHour = Math.min(startHour + durationHours, 22);
      return {
        start: formatHourDecimalToTimeString(startHour),
        end: formatHourDecimalToTimeString(endHour),
      } as TimeRange;
    });

  const slotsArb = fc.array(timeRangeArb, { minLength: 1, maxLength: 5 });
  const minPlaytimeArb = fc.constantFrom(1, 1.5, 2);

  fc.assert(
    fc.property(slotsArb, minPlaytimeArb, (slots, minPlaytimeHours) => {
      const result = filterByMinPlaytime(slots, minPlaytimeHours);

      // All remaining slots must be bookable: some valid duration d >= minPlaytime
      // fits with leftover == 0 or leftover >= 1
      for (const slot of result) {
        const blockDuration =
          Math.round(
            (parseHourStringToDecimal(slot.end) -
              parseHourStringToDecimal(slot.start)) *
              60,
          ) / 60;

        const canBook = validDurations.some((d) => {
          if (d < minPlaytimeHours) return false;
          if (d > blockDuration) return false;
          const leftover = Math.round((blockDuration - d) * 60) / 60;
          return leftover === 0 || leftover >= 1;
        });
        expect(canBook).toBe(true);
      }

      // No slot that IS bookable should have been removed
      for (const slot of slots) {
        const blockDuration =
          Math.round(
            (parseHourStringToDecimal(slot.end) -
              parseHourStringToDecimal(slot.start)) *
              60,
          ) / 60;

        const canBook = validDurations.some((d) => {
          if (d < minPlaytimeHours) return false;
          if (d > blockDuration) return false;
          const leftover = Math.round((blockDuration - d) * 60) / 60;
          return leftover === 0 || leftover >= 1;
        });

        if (canBook) {
          const found = result.some(
            (r) => r.start === slot.start && r.end === slot.end,
          );
          expect(found).toBe(true);
        }
      }
    }),
    { numRuns: 20 },
  );
});

// Feature: multi-club-scanning, Property 8: Hour range filter invariant
/**
 * Property 8: Hour range filter invariant
 *
 * For any list of available time slots and any configured [startHour, endHour] range,
 * after applying the hour range filter, all remaining slots should have
 * start >= startHour and end <= endHour.
 *
 * **Validates: Requirements 7.2, 10.1**
 */
test("Property 8: Hour range filter invariant", () => {
  // Generator: random TimeRange arrays
  const timeRangeArb = fc
    .record({
      startHour: fc.integer({ min: 6, max: 20 }),
      durationHours: fc.integer({ min: 1, max: 4 }),
    })
    .map(({ startHour, durationHours }) => {
      const endHour = Math.min(startHour + durationHours, 22);
      return {
        start: formatHourDecimalToTimeString(startHour),
        end: formatHourDecimalToTimeString(endHour),
      } as TimeRange;
    });

  const slotsArb = fc.array(timeRangeArb, { minLength: 1, maxLength: 5 });

  // Generator: random [startHour, endHour] filter range
  const hourRangeArb = fc
    .record({
      start: fc.integer({ min: 6, max: 18 }),
      span: fc.integer({ min: 2, max: 6 }),
    })
    .map(({ start, span }) => ({
      startHour: start,
      endHour: Math.min(start + span, 22),
    }));

  fc.assert(
    fc.property(slotsArb, hourRangeArb, (slots, range) => {
      const result = filterByHourRange(slots, range.startHour, range.endHour);

      // All remaining slots have start >= startHour and end <= endHour
      for (const slot of result) {
        const slotStart = parseHourStringToDecimal(slot.start);
        const slotEnd = parseHourStringToDecimal(slot.end);
        expect(slotStart).toBeGreaterThanOrEqual(range.startHour - 0.001);
        expect(slotEnd).toBeLessThanOrEqual(range.endHour + 0.001);
      }
    }),
    { numRuns: 20 },
  );
});

// Feature: multi-club-scanning, Property 12: MatchPointer URL construction
/**
 * Property 12: MatchPointer URL construction
 *
 * For any venue ID string, the constructed MatchPointer venue URL should contain
 * `id=eq.{venueId}` and the courts URL should contain `venue_id=eq.{venueId}`.
 *
 * **Validates: Requirements 3.1, 3.2**
 */
test("Property 12: MatchPointer URL construction", async () => {
  // Generator: alphanumeric venue IDs
  const venueIdArb = fc
    .array(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789"), {
      minLength: 1,
      maxLength: 20,
    })
    .map((chars) => chars.join(""));

  await fc.assert(
    fc.asyncProperty(venueIdArb, async (venueId) => {
      let capturedUrls: string[] = [];

      // Mock global.fetch to capture URLs
      const originalFetch = global.fetch;
      global.fetch = async (input: RequestInfo | URL, _init?: RequestInit) => {
        capturedUrls.push(input.toString());
        // Return a mock response with venue data for the first call
        return new Response(
          JSON.stringify([
            {
              id: 1,
              name: "Test Venue",
              opening_hours: { timeRanges: [] },
            },
          ]),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      };

      try {
        // Call fetchVenueDetails — captures the venue URL
        await fetchVenueDetails(venueId);
        // Call fetchActiveCourts — captures the courts URL
        await fetchActiveCourts(venueId);

        // Verify venue URL contains id=eq.{venueId}
        const venueUrl = capturedUrls[0];
        expect(venueUrl).toContain(`id=eq.${venueId}`);
        expect(venueUrl).toBe(
          `https://api.matchpointer.app/rest/v1/venues?select=*&is_active=eq.true&id=eq.${venueId}`,
        );

        // Verify courts URL contains venue_id=eq.{venueId}
        const courtsUrl = capturedUrls[1];
        expect(courtsUrl).toContain(`venue_id=eq.${venueId}`);
        expect(courtsUrl).toBe(
          `https://api.matchpointer.app/rest/v1/courts?select=*&venue_id=eq.${venueId}&is_active=eq.true&order=name.asc`,
        );
      } finally {
        global.fetch = originalFetch;
      }
    }),
    { numRuns: 20 },
  );
});
