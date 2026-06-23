import { formatHourDecimalToTimeString } from "./date.utils";
import { TimeSlot } from "./types.util";

function formatSlotLine(slot: TimeSlot): string {
  return `• Free court on ${slot.date} between ${formatHourDecimalToTimeString(
    slot.start,
  )} and ${formatHourDecimalToTimeString(slot.end)}`;
}

export function formatCourtMessage(
  newSlots: TimeSlot[],
  oldSlots: TimeSlot[],
): string {
  if (newSlots.length === 0 && oldSlots.length === 0) {
    return "No free court slots found.";
  }

  const sections: string[] = [];

  if (newSlots.length > 0) {
    const lines = newSlots.map(formatSlotLine);
    sections.push(`🆕 New slots found:\n${lines.join("\n\n")}`);
  }

  if (oldSlots.length > 0) {
    const lines = oldSlots.map(formatSlotLine);
    sections.push(`📋 Previously found slots:\n${lines.join("\n\n")}`);
  }

  return sections.join("\n\n");
}
