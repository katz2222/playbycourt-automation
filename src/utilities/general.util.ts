import { TimeSlot } from "./types.util";

function formatHour(hour: number): string {
  const h: number = Math.floor(hour);
  const m: number = (hour % 1) * 60;
  return `${h.toString().padStart(2, "0")}:${m === 0 ? "00" : "30"}`;
}

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
