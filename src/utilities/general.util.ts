function formatHour(hour: number): string {
  const h = Math.floor(hour);
  const m = (hour % 1) * 60;
  return `${h.toString().padStart(2, "0")}:${m === 0 ? "00" : "30"}`;
}

export function formatCourtMessage(
  slots: { date: string; start: number; end: number }[]
): string {
  let message = "✅ Free court slots found:\n";
  for (const slot of slots) {
    message += `• Free court on ${slot.date} between ${formatHour(
      slot.start
    )} and ${formatHour(slot.end)}\n`;
  }
  return message.trim();
}
