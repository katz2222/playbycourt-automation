import { formatCourtMessage } from "@src/utilities/general.util";
import { logScanParameters } from "@src/utilities/logger.utils";
import { scanCourtSlots } from "@src/utilities/slots.util";
import { findNewSlots, hasAnySlotBecomeUnavailable, loadSlotHistory, updateSlotHistoryExcel } from "@src/utilities/slotsHistory.util";
import { ScanCourtSlotsOptions, SlotHistoryRecord, TimeSlot } from "@src/utilities/types.util";
import { sendWhatsAppMessage } from "@src/utilities/whatsappSender.util";

export async function checkCourtAvailability(): Promise<void> {
  const scanParameters: ScanCourtSlotsOptions = {
    startDate: new Date(),
    endDate: new Date(Date.now() + 14 * 24 * 3600 * 1000),
    startHour: 19,
    endHour: 22.5,
    skipWeekend: true,
  };

  logScanParameters(scanParameters);

  const availableTimeSlots: TimeSlot[] = await scanCourtSlots(scanParameters);

  const previousRecords: SlotHistoryRecord[] = loadSlotHistory();

  const newSlots: TimeSlot[] = findNewSlots(
    availableTimeSlots,
    previousRecords
  );
    const message = formatCourtMessage(availableTimeSlots);
    console.log(message);

  if (newSlots.length > 0) {
    console.log(`New slots:\n${(JSON.stringify(newSlots, null, 2))}`);

    await sendWhatsAppMessage(message);

    updateSlotHistoryExcel(availableTimeSlots);
  } else {
    console.log("No new slots found, not sending message.");

    const hasUnavailable = hasAnySlotBecomeUnavailable(
      availableTimeSlots,
      previousRecords
    );

    if (hasUnavailable) {
      updateSlotHistoryExcel(availableTimeSlots);
      console.log("Some slots became unavailable. Excel updated.");
    } else {
      console.log("No slot availability changes. Excel not updated.");
    }
  }
}