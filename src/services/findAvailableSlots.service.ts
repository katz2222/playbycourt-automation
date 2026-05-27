import { formatCourtMessage } from "@src/utilities/general.util";
import { logScanParameters } from "@src/utilities/logger.utils";
import { scanCourtSlots } from "@src/utilities/slots.util";
import {
  findNewSlots,
  hasAnySlotBecomeUnavailable,
  loadSlotHistory,
  updateSlotHistoryExcel,
  withSlotHistoryLock,
} from "@src/utilities/slotsHistory.util";
import {
  ScanCourtSlotsOptions,
  SlotHistoryRecord,
  TimeSlot,
} from "@src/utilities/types.util";
import { sendTelegramMessage } from "@src/utilities/telegramSender.util";
import { formatDate, generateDateRange } from "@src/utilities/date.utils";

export async function checkCourtAvailability(
  params: ScanCourtSlotsOptions,
): Promise<void> {
  logScanParameters(params);

  const availableTimeSlots: TimeSlot[] = await scanCourtSlots(params);

  // Compute the set of dates this scan actually covered
  const dates = generateDateRange(params.startDate, params.endDate, {
    skipWeekend: params.skipWeekend,
    skipWeekdays: params.skipWeekdays,
  });
  const scannedDates: Set<string> = new Set(dates.map(formatDate));

  const message = formatCourtMessage(availableTimeSlots);
  console.log(message);

  await withSlotHistoryLock(async () => {
    const previousRecords: SlotHistoryRecord[] = loadSlotHistory();

    const newSlots: TimeSlot[] = findNewSlots(
      availableTimeSlots,
      previousRecords,
    );

    if (newSlots.length > 0) {
      console.log(`New slots:\n${JSON.stringify(newSlots, null, 2)}`);
      await sendTelegramMessage(message);
      updateSlotHistoryExcel(availableTimeSlots, scannedDates);
    } else {
      console.log("No new slots found, not sending message.");

      const hasUnavailable = hasAnySlotBecomeUnavailable(
        availableTimeSlots,
        previousRecords,
      );

      if (hasUnavailable) {
        updateSlotHistoryExcel(availableTimeSlots, scannedDates);
        console.log("Some slots became unavailable. Excel updated.");
      } else {
        console.log("No slot availability changes. Excel not updated.");
      }
    }
  });
}
