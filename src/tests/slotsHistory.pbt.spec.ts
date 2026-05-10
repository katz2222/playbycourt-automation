import { test, expect } from "@playwright/test";
import fc from "fast-check";
import { markUnavailableSlots } from "../utilities/slotsHistory.util";
import { SlotHistoryRecord } from "../utilities/types.util";

/**
 * Property 1: Bug Condition - Out-of-Range Slots Incorrectly Marked Unavailable
 *
 * For any history record where TimeSlot.start falls outside the current scan's
 * [startHour, endHour) range and becameUnavailableAt is undefined,
 * markUnavailableSlots should leave becameUnavailableAt unchanged (still undefined).
 *
 * On UNFIXED code, this test is EXPECTED TO FAIL because the unfixed
 * markUnavailableSlots marks ALL records as unavailable when they are not
 * in currentSlotKeys, regardless of hour range.
 *
 * **Validates: Requirements 1.1, 2.1**
 */
test("Property 1: Bug Condition - out-of-range slots should NOT be marked unavailable", () => {
  fc.assert(
    fc.property(
      // Generate startHour in [0, 22]
      fc.integer({ min: 0, max: 22 }),
      // Generate a range size of at least 1 (endHour = startHour + rangeSize)
      fc.integer({ min: 1, max: 24 }),
      // Boolean to decide if slotStart is below startHour or at/above endHour
      fc.boolean(),
      // Random date string
      fc.constantFrom("01/01 Monday", "15/06 Sunday", "28/12 Saturday"),
      // Random end offset (slot duration in hours, 0.5 to 2)
      fc.constantFrom(0.5, 1, 1.5, 2),
      (startHour, rangeSize, slotBelow, dateStr, duration) => {
        const endHour = Math.min(startHour + rangeSize, 24);
        fc.pre(endHour > startHour);

        // Generate slotStart outside [startHour, endHour)
        let slotStart: number;
        if (slotBelow && startHour > 0) {
          // slotStart < startHour: pick from [0, startHour - 1]
          slotStart = startHour - 1;
        } else if (!slotBelow && endHour <= 23) {
          // slotStart >= endHour: pick endHour itself
          slotStart = endHour;
        } else if (startHour > 0) {
          // fallback: below range
          slotStart = 0;
        } else {
          // startHour is 0 and endHour is 24 — no out-of-range possible
          fc.pre(false);
          return;
        }

        // Ensure slotStart is truly outside [startHour, endHour)
        fc.pre(slotStart < startHour || slotStart >= endHour);

        const slotEnd = Math.min(slotStart + duration, 24);

        const record: SlotHistoryRecord = {
          TimeSlot: {
            date: dateStr,
            start: slotStart,
            end: slotEnd,
          },
          becameAvailableAt: "2025-01-01 10:00",
          becameUnavailableAt: undefined,
        };

        // Call markUnavailableSlots with an empty currentSlotKeys set
        // (the record is not in current results, but it's out of range
        //  so it should NOT be marked unavailable)
        const emptyCurrentSlotKeys = new Set<string>();
        markUnavailableSlots([record], emptyCurrentSlotKeys, {
          startHour,
          endHour,
        });

        // Assert: becameUnavailableAt should still be undefined
        // On unfixed code, this WILL FAIL because the function marks
        // all records not in currentSlotKeys as unavailable
        expect(record.becameUnavailableAt).toBeUndefined();
      },
    ),
    { numRuns: 100 },
  );
});

/**
 * Property 2: Preservation - In-Range Slot Marking Behavior Unchanged
 *
 * For any history record where TimeSlot.start falls within the current scan's
 * [startHour, endHour) range and becameUnavailableAt is undefined:
 *
 * Case A: If the record's key is NOT in currentSlotKeys, markUnavailableSlots
 *         should set becameUnavailableAt (non-undefined).
 * Case B: If the record's key IS in currentSlotKeys, markUnavailableSlots
 *         should leave becameUnavailableAt as undefined.
 *
 * These tests exercise the ORIGINAL unfixed markUnavailableSlots (no scanParams
 * parameter) since in-range behavior should be identical before and after the fix.
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 */
test("Property 2a: Preservation - in-range slot absent from current is marked unavailable", () => {
  fc.assert(
    fc.property(
      // Generate startHour in [0, 22]
      fc.integer({ min: 0, max: 22 }),
      // Generate endHour offset (at least 1 above startHour)
      fc.integer({ min: 1, max: 24 }),
      // Offset within range for slotStart (0 = startHour, clamped to range)
      fc.integer({ min: 0, max: 23 }),
      // Random date string
      fc.constantFrom("01/01 Monday", "15/06 Sunday", "28/12 Saturday"),
      // Random slot duration
      fc.constantFrom(0.5, 1, 1.5, 2),
      (startHour, endHourRaw, slotOffset, dateStr, duration) => {
        const endHour = Math.min(startHour + endHourRaw, 24);
        fc.pre(endHour > startHour);

        // Generate slotStart within [startHour, endHour)
        const slotStart = startHour + (slotOffset % (endHour - startHour));
        fc.pre(slotStart >= startHour && slotStart < endHour);

        const slotEnd = Math.min(slotStart + duration, 24);

        const record: SlotHistoryRecord = {
          TimeSlot: {
            date: dateStr,
            start: slotStart,
            end: slotEnd,
          },
          becameAvailableAt: "2025-01-01 10:00",
          becameUnavailableAt: undefined,
        };

        // Case A: Call with empty currentSlotKeys (slot is absent from current)
        // The record is in-range, so it SHOULD be marked unavailable
        const emptyCurrentSlotKeys = new Set<string>();
        markUnavailableSlots([record], emptyCurrentSlotKeys, {
          startHour,
          endHour,
        });

        // Assert: becameUnavailableAt should be set (non-undefined)
        expect(record.becameUnavailableAt).toBeDefined();
      },
    ),
    { numRuns: 100 },
  );
});

test("Property 2b: Preservation - in-range slot present in current remains available", () => {
  fc.assert(
    fc.property(
      // Generate startHour in [0, 22]
      fc.integer({ min: 0, max: 22 }),
      // Generate endHour offset (at least 1 above startHour)
      fc.integer({ min: 1, max: 24 }),
      // Offset within range for slotStart (0 = startHour, clamped to range)
      fc.integer({ min: 0, max: 23 }),
      // Random date string
      fc.constantFrom("01/01 Monday", "15/06 Sunday", "28/12 Saturday"),
      // Random slot duration
      fc.constantFrom(0.5, 1, 1.5, 2),
      (startHour, endHourRaw, slotOffset, dateStr, duration) => {
        const endHour = Math.min(startHour + endHourRaw, 24);
        fc.pre(endHour > startHour);

        // Generate slotStart within [startHour, endHour)
        const slotStart = startHour + (slotOffset % (endHour - startHour));
        fc.pre(slotStart >= startHour && slotStart < endHour);

        const slotEnd = Math.min(slotStart + duration, 24);

        const record: SlotHistoryRecord = {
          TimeSlot: {
            date: dateStr,
            start: slotStart,
            end: slotEnd,
          },
          becameAvailableAt: "2025-01-01 10:00",
          becameUnavailableAt: undefined,
        };

        // Build the key matching the slotKey function: `${date}-${start}-${end}`
        const key = `${dateStr}-${slotStart}-${slotEnd}`;
        const currentSlotKeys = new Set<string>([key]);

        // Case B: Call with currentSlotKeys containing the record's key
        // The record is in-range and present, so it should remain unchanged
        markUnavailableSlots([record], currentSlotKeys, { startHour, endHour });

        // Assert: becameUnavailableAt should still be undefined
        expect(record.becameUnavailableAt).toBeUndefined();
      },
    ),
    { numRuns: 100 },
  );
});
