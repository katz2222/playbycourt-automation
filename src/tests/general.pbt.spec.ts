import { test, expect } from "@playwright/test";
import fc from "fast-check";
import { formatCourtMessage } from "@utils/general.util";
import { TimeSlot } from "@utils/types.util";

// Feature: multi-club-scanning, Property 10: Club name included in notification message
/**
 * Property 10: Club name included in notification message
 *
 * For any non-empty club name and any list of time slots, the formatted notification
 * message should contain the club name as a substring.
 *
 * **Validates: Requirements 9.2**
 */
test("Property 10: Club name included in notification message", () => {
  const clubNameArb = fc
    .array(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789 "), {
      minLength: 1,
      maxLength: 30,
    })
    .map((chars) => chars.join(""))
    .filter((s) => s.trim().length > 0);

  const timeSlotArb = fc
    .record({
      date: fc.constantFrom("01/01 Monday", "15/06 Sunday", "28/12 Saturday"),
      start: fc.integer({ min: 6, max: 20 }),
      end: fc.integer({ min: 7, max: 22 }),
    })
    .filter((s) => s.end > s.start);

  const slotsArb = fc.array(timeSlotArb, { minLength: 1, maxLength: 5 });

  fc.assert(
    fc.property(clubNameArb, slotsArb, (clubName, slots) => {
      const message = formatCourtMessage(clubName, slots, []);
      expect(message).toContain(clubName);
    }),
    { numRuns: 20 },
  );
});
