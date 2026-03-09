import { formatCourtMessage } from "@src/utilities/general.util";
import { scanCourtSlots } from "@src/utilities/slots.util";
import { findNewSlots, hasAnySlotBecomeUnavailable, loadSlotHistory, updateSlotHistoryExcel } from "@src/utilities/slotsHistory.util";
import { sendWhatsAppMessage } from "@src/utilities/whatsappSender.util";

export async function checkCourtAvailability() {
  console.log("Checking court availability...");
  const availableTimeSlots = await scanCourtSlots(
    new Date(),
    new Date(Date.now() + 14 * 24 * 3600 * 1000),
    19,
    22.5
  );

  const previousRecords = loadSlotHistory();

  const newSlots = findNewSlots(
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