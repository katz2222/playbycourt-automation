export function parseSlotStartTimeToHour(slot: string): number {
  const [start, end] = slot.replace("+", "").split("-");
  const ampm = end.match(/am|pm/i)?.[0].toLowerCase();

  const time: string = start.trim();
  const [hourStr, minStr] = time.split(":");
  let hour: number = parseInt(hourStr, 10);
  const minutes: number = parseInt(minStr || "0", 10);

  if (ampm === "pm" && hour < 12) hour += 12;
  if (ampm === "am" && hour === 12) hour = 0;

  return hour + minutes / 60;
}

export function formatDate(date: Date): string {
  const day: string = String(date.getDate()).padStart(2, "0");
  const month: string = String(date.getMonth() + 1).padStart(2, "0");
  const weekday: string = date.toLocaleString("en-US", { weekday: "long" });

  return `${day}/${month} ${weekday}`;
}

export function isWeekend(day: number): boolean {
  return day === 5 || day === 6;
}
