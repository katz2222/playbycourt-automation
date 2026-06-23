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
import { formatDate, resolveScanDates } from "@src/utilities/date.utils";

export async function checkCourtAvailability(
  params: ScanCourtSlotsOptions,
): Promise<void> {
  logScanParameters(params);

  const availableTimeSlots: TimeSlot[] = await scanCourtSlots(params);

  const dates = resolveScanDates(params);
  const scannedDates: Set<string> = new Set(dates.map(formatDate));
  const hourRange = { startHour: params.startHour, endHour: params.endHour };

  await withSlotHistoryLock(async () => {
    const fullSlotsHistory: SlotHistoryRecord[] = loadSlotHistory();

    const newSlots: TimeSlot[] = findNewSlots(
      availableTimeSlots,
      fullSlotsHistory,
    );

    const knownSlots: TimeSlot[] = availableTimeSlots.filter(
      (slot) => !newSlots.includes(slot),
    );

    const message = formatCourtMessage(newSlots, knownSlots);
    console.log(message);

    if (newSlots.length > 0) {
      await sendTelegramMessage(message);
      updateSlotHistoryExcel(availableTimeSlots, scannedDates, hourRange);
    } else {
      const hasUnavailable = hasAnySlotBecomeUnavailable(
        availableTimeSlots,
        fullSlotsHistory,
        scannedDates,
        hourRange,
      );

      if (hasUnavailable) {
        updateSlotHistoryExcel(availableTimeSlots, scannedDates, hourRange);
        console.log("Some slots became unavailable. Excel updated.");
      } else {
        console.log("No slot availability changes. Excel not updated.");
      }
    }
  });
}
