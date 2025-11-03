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
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };

  const formatted: string = now.toLocaleString("en-GB", options);
  const [datePart, timePart] = formatted.split(", ");
  const [dd, mm, yyyy] = datePart.split("/");
  return `${yyyy}-${mm}-${dd} ${timePart}`;
}

export function formatHourDecimalToTimeString(decimalHour: number): string {
  const hours = Math.floor(decimalHour);
  const minutes = Math.round((decimalHour - hours) * 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
}

export function parseHourStringToDecimal(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours + minutes / 60;
}

export function smartParseDate(
  dateStr: string,
  contextTimestamp: string
): Date {
  const [day, month] = dateStr.split(" ")[0].split("/").map(Number);
  const contextDate: Date = new Date(contextTimestamp);
  let year: number = contextDate.getFullYear();

  let slotDate: Date = new Date(year, month - 1, day);

  const TWO_WEEKS_MS: number = 14 * 24 * 60 * 60 * 1000;

  // If slot date is more than 2 weeks in the past, it's probably for next year
  if (slotDate.getTime() < contextDate.getTime() - TWO_WEEKS_MS) {
    slotDate = new Date(year + 1, month - 1, day);
  }

  return slotDate;
}

export function prettyDateTime(dateTimeStr: string): string {
  // Input example: "2025-10-23 14:30"
  const [datePart, timePart] = dateTimeStr.split(" ");
  const [yyyy, mm, dd] = datePart.split("-");
  return `${dd}/${mm}/${yyyy} ${timePart}`;
}

export function reversePrettyDateTime(prettyDateTimeStr: string): string {
  // Input example: "23/10/2025 14:30"
  const [datePart, timePart] = prettyDateTimeStr.split(" ");
  const [dd, mm, yyyy] = datePart.split("/");
  return `${yyyy}-${mm}-${dd} ${timePart}`;
}
