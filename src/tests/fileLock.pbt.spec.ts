import { test, expect } from "@playwright/test";
import fc from "fast-check";
import {
  findNewSlots,
  loadSlotHistory,
  withSlotHistoryLock,
} from "../utilities/slotsHistory.util";
import { SlotHistoryRecord, TimeSlot } from "../utilities/types.util";

/**
 * Property 1: Bug Condition - Parallel Runs Produce Duplicate Notifications (TOCTOU Race)
 *
 * This test demonstrates the TOCTOU race condition: when two runs execute concurrently,
 * both load history before either writes, so both compute the same newSlots and both
 * would send notifications (duplicates).
 *
 * The test verifies that `withSlotHistoryLock` serializes access to the critical section
 * (loadSlotHistory → findNewSlots → sendTelegram → updateSlotHistoryExcel), ensuring
 * only one run can enter at a time.
 *
 * On UNFIXED code: `withSlotHistoryLock` does not exist, so the test FAILS.
 * This failure confirms the bug exists — there is no lock mechanism to prevent
 * concurrent access to the critical section.
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 2.2, 2.3**
 */
test("Property 1: Bug Condition - withSlotHistoryLock serializes concurrent access to prevent duplicate notifications", async () => {
  // Verify withSlotHistoryLock exists and is a function
  // On UNFIXED code, this import will fail because withSlotHistoryLock doesn't exist
  expect(withSlotHistoryLock).toBeDefined();
  expect(typeof withSlotHistoryLock).toBe("function");

  await fc.assert(
    fc.asyncProperty(
      // Generate random slots that would be "new" (not in history)
      fc.array(
        fc.record({
          date: fc.constantFrom(
            "01/01 Monday",
            "15/06 Sunday",
            "28/12 Saturday",
          ),
          start: fc.integer({ min: 6, max: 22 }),
          end: fc.integer({ min: 7, max: 23 }),
        }),
        { minLength: 1, maxLength: 5 },
      ),
      // Generate a delay to simulate timing between concurrent runs (ms)
      fc.integer({ min: 0, max: 50 }),
      async (slots: TimeSlot[], delayMs: number) => {
        // Ensure end > start for valid slots
        const validSlots = slots
          .map((s) => ({
            ...s,
            end: Math.max(s.start + 1, s.end),
          }))
          .filter((s) => s.end <= 24);
        fc.pre(validSlots.length > 0);

        // Track how many runs are inside the critical section concurrently
        let concurrentCount = 0;
        let maxConcurrent = 0;

        // Simulate the critical section: load → find → notify → write
        const criticalSection = async (): Promise<TimeSlot[]> => {
          concurrentCount++;
          maxConcurrent = Math.max(maxConcurrent, concurrentCount);

          // Simulate loadSlotHistory (read)
          await new Promise((resolve) => setTimeout(resolve, delayMs));

          // Simulate findNewSlots (compute)
          const emptyHistory: SlotHistoryRecord[] = [];
          const newSlots = findNewSlots(validSlots, emptyHistory);

          // Simulate sendTelegramMessage + updateSlotHistoryExcel (write)
          await new Promise((resolve) => setTimeout(resolve, delayMs));

          concurrentCount--;
          return newSlots;
        };

        // Run two concurrent calls through the lock wrapper
        // withSlotHistoryLock should serialize them so maxConcurrent never exceeds 1
        const [resultA, resultB] = await Promise.all([
          withSlotHistoryLock(criticalSection),
          withSlotHistoryLock(criticalSection),
        ]);

        // With the lock, only one run should be in the critical section at a time
        // This means maxConcurrent should be exactly 1 (serialized access)
        expect(maxConcurrent).toBe(1);

        // Both runs complete successfully (lock doesn't prevent execution, just serializes it)
        expect(resultA).toBeDefined();
        expect(resultB).toBeDefined();
      },
    ),
    { numRuns: 20 },
  );
});
