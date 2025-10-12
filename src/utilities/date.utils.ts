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

export function hasHourPassed(date: Date, targetHour: number): boolean {
  return date.getHours() >= targetHour;
}

export function searchFromDate(): Date {
  const now: Date = new Date();
  const lastSearchHourOfDay: number = 22;

  if (hasHourPassed(now, lastSearchHourOfDay)) {
    now.setDate(now.getDate() + 1);
  }
  return now;
}

export function getCurrentDateTime(): string {
  const now: Date = new Date();
  const yyyy: number = now.getFullYear();
  const mm: string = String(now.getMonth() + 1).padStart(2, "0");
  const dd: string = String(now.getDate()).padStart(2, "0");
  const hh: string = String(now.getHours()).padStart(2, "0");
  const min: string = String(now.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export function formatHourDecimalToTimeString(decimalHour: number): string {
  const hours = Math.floor(decimalHour);
  const minutes = Math.round((decimalHour - hours) * 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
}
