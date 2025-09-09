function formatHour(hour: number): string {
  const h = Math.floor(hour);
  const m = (hour % 1) * 60;
  return `${h.toString().padStart(2, "0")}:${m === 0 ? "00" : "30"}`;
}

export function formatCourtMessage(
  slots: { date: string; start: number; end: number }[]
): string {
  if (slots.length === 0) {
    return "No free court slots found.";
  }

  const header = "✅ Free court slots found:";
  const lines = slots.map(
    (slot) =>
      `• Free court on ${slot.date} between ${formatHour(
        slot.start
      )} and ${formatHour(slot.end)}`
  );
  return `${header}\n${lines.join("\n\n")}`;
}
