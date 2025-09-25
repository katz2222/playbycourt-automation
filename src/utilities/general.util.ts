import { formatHour } from "./date.utils";
import { TimeSlot } from "./types.util";

export function formatCourtMessage(slots: TimeSlot[]): string {
  if (slots.length === 0) {
    return "No free court slots found.";
  }

  const header: string = "✅ Free court slots found:";
  const lines: string[] = slots.map(
    (slot) =>
      `• Free court on ${slot.date} between ${formatHour(
        slot.start
      )} and ${formatHour(slot.end)}`
  );
  return `${header}\n${lines.join("\n\n")}`;
}
