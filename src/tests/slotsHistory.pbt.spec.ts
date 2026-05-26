import { test, expect } from "@playwright/test";
import fc from "fast-check";
import {
  markUnavailableSlots,
  findNewSlots,
  hasAnySlotBecomeUnavailable,
} from "../utilities/slotsHistory.util";
import { SlotHistoryRecord, TimeSlot } from "../utilities/types.util";

/**
 * Property 1: All absent slots are marked unavailable regardless of hour range
 *
 * After the fix, markUnavailableSlots no longer applies an hour-range filter.
 * ALL records not present in currentSlotKeys (and with becameUnavailableAt undefined)
 * are marked as unavailable, regardless of their TimeSlot.start hour.
 *
 * **Validates: Requirements 2.4**
 */
test("Property 1: All absent slots are marked unavailable regardless of hour range", () => {
  fc.assert(
    fc.property(
      // Generate a slot start hour (any hour)
      fc.integer({ min: 0, max: 23 }),
      // Random date string
      fc.constantFrom("01/01 Monday", "15/06 Sunday", "28/12 Saturday"),
      // Random slot duration
      fc.constantFrom(0.5, 1, 1.5, 2),
      (slotStart, dateStr, duration) => {
        const slotEnd = Math.min(slotStart + duration, 24);
        fc.pre(slotEnd > slotStart);

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
        // The record is absent from current results, so it SHOULD be marked unavailable
        const emptyCurrentSlotKeys = new Set<string>();
        markUnavailableSlots([record], emptyCurrentSlotKeys);

        // Assert: becameUnavailableAt should be set (slot is absent, so marked unavailable)
        expect(record.becameUnavailableAt).toBeDefined();
      },
    ),
    { numRuns: 100 },
  );
});

/**
 * Property 2: Preservation - Slot Marking Behavior Unchanged
 *
 * Case A: If the record's key is NOT in currentSlotKeys, markUnavailableSlots
 *         should set becameUnavailableAt (non-undefined).
 * Case B: If the record's key IS in currentSlotKeys, markUnavailableSlots
 *         should leave becameUnavailableAt as undefined.
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 */
test("Property 2a: Preservation - slot absent from current is marked unavailable", () => {
  fc.assert(
    fc.property(
      // Generate slotStart
      fc.integer({ min: 0, max: 23 }),
      // Random date string
      fc.constantFrom("01/01 Monday", "15/06 Sunday", "28/12 Saturday"),
      // Random slot duration
      fc.constantFrom(0.5, 1, 1.5, 2),
      (slotStart, dateStr, duration) => {
        const slotEnd = Math.min(slotStart + duration, 24);
        fc.pre(slotEnd > slotStart);

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
        // It SHOULD be marked unavailable
        const emptyCurrentSlotKeys = new Set<string>();
        markUnavailableSlots([record], emptyCurrentSlotKeys);

        // Assert: becameUnavailableAt should be set (non-undefined)
        expect(record.becameUnavailableAt).toBeDefined();
      },
    ),
    { numRuns: 100 },
  );
});

test("Property 2b: Preservation - slot present in current remains available", () => {
  fc.assert(
    fc.property(
      // Generate slotStart
      fc.integer({ min: 0, max: 23 }),
      // Random date string
      fc.constantFrom("01/01 Monday", "15/06 Sunday", "28/12 Saturday"),
      // Random slot duration
      fc.constantFrom(0.5, 1, 1.5, 2),
      (slotStart, dateStr, duration) => {
        const slotEnd = Math.min(slotStart + duration, 24);
        fc.pre(slotEnd > slotStart);

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
        // The record is present, so it should remain unchanged
        markUnavailableSlots([record], currentSlotKeys);

        // Assert: becameUnavailableAt should still be undefined
        expect(record.becameUnavailableAt).toBeUndefined();
      },
    ),
    { numRuns: 100 },
  );
});

/**
 * Property 2c: Preservation - findNewSlots returns all slots when history is empty
 *
 * For any set of current slots, when findNewSlots is called with an empty history,
 * ALL current slots should be returned as new (since none are known).
 *
 * **Validates: Requirements 3.1**
 */
test("Property 2c: Preservation - findNewSlots with empty history returns all slots as new", () => {
  // Arbitrary generator for TimeSlot
  const timeSlotArb = fc
    .record({
      date: fc.constantFrom(
        "01/01 Monday",
        "15/06 Sunday",
        "28/12 Saturday",
        "10/03 Wednesday",
        "22/09 Friday",
      ),
      start: fc.integer({ min: 0, max: 23 }),
      end: fc.integer({ min: 1, max: 24 }),
    })
    .filter((s) => s.end > s.start);

  fc.assert(
    fc.property(
      fc.array(timeSlotArb, { minLength: 1, maxLength: 20 }),
      (slots: TimeSlot[]) => {
        // Deduplicate slots by key to avoid counting duplicates
        const uniqueKeys = new Set(
          slots.map((s) => `${s.date}-${s.start}-${s.end}`),
        );
        const uniqueSlots = slots.filter((s, i) => {
          const key = `${s.date}-${s.start}-${s.end}`;
          return (
            slots.findIndex(
              (s2) => `${s2.date}-${s2.start}-${s2.end}` === key,
            ) === i
          );
        });

        const result = findNewSlots(uniqueSlots, []);

        // All unique slots should be returned as new when history is empty
        expect(result.length).toBe(uniqueSlots.length);
      },
    ),
    { numRuns: 100 },
  );
});

/**
 * Property 2d: Preservation - findNewSlots returns empty when all slots are already known
 *
 * For any set of current slots, when findNewSlots is called with history records
 * that contain those same slots (active, no becameUnavailableAt), it should return
 * an empty array (no new slots).
 *
 * **Validates: Requirements 3.2**
 */
test("Property 2d: Preservation - findNewSlots with known active slots returns empty", () => {
  const timeSlotArb = fc
    .record({
      date: fc.constantFrom(
        "01/01 Monday",
        "15/06 Sunday",
        "28/12 Saturday",
        "10/03 Wednesday",
        "22/09 Friday",
      ),
      start: fc.integer({ min: 0, max: 23 }),
      end: fc.integer({ min: 1, max: 24 }),
    })
    .filter((s) => s.end > s.start);

  fc.assert(
    fc.property(
      fc.array(timeSlotArb, { minLength: 1, maxLength: 20 }),
      (slots: TimeSlot[]) => {
        // Deduplicate slots
        const uniqueSlots = slots.filter((s, i) => {
          const key = `${s.date}-${s.start}-${s.end}`;
          return (
            slots.findIndex(
              (s2) => `${s2.date}-${s2.start}-${s2.end}` === key,
            ) === i
          );
        });

        // Create history records for all slots (active, no becameUnavailableAt)
        const historyRecords: SlotHistoryRecord[] = uniqueSlots.map((slot) => ({
          TimeSlot: slot,
          becameAvailableAt: "2025-01-01 10:00",
          becameUnavailableAt: undefined,
        }));

        const result = findNewSlots(uniqueSlots, historyRecords);

        // No slots should be reported as new since all are already in history
        expect(result.length).toBe(0);
      },
    ),
    { numRuns: 100 },
  );
});

/**
 * Property 2e: Preservation - hasAnySlotBecomeUnavailable detects unavailable slots
 *
 * When a previously-active slot (no becameUnavailableAt) is no longer
 * present in currentSlots, hasAnySlotBecomeUnavailable should return true.
 *
 * **Validates: Requirements 3.3**
 */
test("Property 2e: Preservation - hasAnySlotBecomeUnavailable detects missing slots", () => {
  fc.assert(
    fc.property(
      // Generate slotStart
      fc.integer({ min: 0, max: 23 }),
      // Random date string
      fc.constantFrom("01/01 Monday", "15/06 Sunday", "28/12 Saturday"),
      // Random slot duration
      fc.constantFrom(0.5, 1, 1.5, 2),
      (slotStart, dateStr, duration) => {
        const slotEnd = Math.min(slotStart + duration, 24);
        fc.pre(slotEnd > slotStart);

        // Create a history record for a previously-active slot
        const previousRecords: SlotHistoryRecord[] = [
          {
            TimeSlot: { date: dateStr, start: slotStart, end: slotEnd },
            becameAvailableAt: "2025-01-01 10:00",
            becameUnavailableAt: undefined,
          },
        ];

        // Call with empty currentSlots (the slot is no longer available)
        const result = hasAnySlotBecomeUnavailable([], previousRecords);

        // Should detect that the slot became unavailable
        expect(result).toBe(true);
      },
    ),
    { numRuns: 100 },
  );
});

/**
 * Property 2f: Preservation - hasAnySlotBecomeUnavailable no false positives
 *
 * When all previously-active slots (no becameUnavailableAt) are still
 * present in currentSlots, hasAnySlotBecomeUnavailable should return false.
 *
 * **Validates: Requirements 3.4**
 */
test("Property 2f: Preservation - hasAnySlotBecomeUnavailable no false positives when all present", () => {
  fc.assert(
    fc.property(
      // Generate slotStart
      fc.integer({ min: 0, max: 23 }),
      // Random date string
      fc.constantFrom("01/01 Monday", "15/06 Sunday", "28/12 Saturday"),
      // Random slot duration
      fc.constantFrom(0.5, 1, 1.5, 2),
      (slotStart, dateStr, duration) => {
        const slotEnd = Math.min(slotStart + duration, 24);
        fc.pre(slotEnd > slotStart);

        const slot: TimeSlot = {
          date: dateStr,
          start: slotStart,
          end: slotEnd,
        };

        // Create a history record for a previously-active slot
        const previousRecords: SlotHistoryRecord[] = [
          {
            TimeSlot: slot,
            becameAvailableAt: "2025-01-01 10:00",
            becameUnavailableAt: undefined,
          },
        ];

        // Call with currentSlots containing the same slot
        const result = hasAnySlotBecomeUnavailable([slot], previousRecords);

        // Should NOT detect any slot as unavailable
        expect(result).toBe(false);
      },
    ),
    { numRuns: 100 },
  );
});
