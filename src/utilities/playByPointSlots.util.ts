import { fetchAvailableHours } from "./playByPointApi.util";
import { dateToTimestamp, formatDate } from "./date.utils";
import { ApiSlot, TimeSlot } from "./types.util";

export function filterSlotsInRange(
  slots: ApiSlot[],
  startHour: number,
  endHour: number,
): ApiSlot[] {
  const start = startHour * 3600;
  const end = endHour * 3600;

  return slots.filter(
    (s) =>
      s.available &&
      s.seconds_from_midnight >= start &&
      s.seconds_from_midnight < end,
  );
}

export function findConsecutiveSlots(
  slots: ApiSlot[],
  date: string,
  requiredSlots: number = 3,
): TimeSlot[] {
  const results: TimeSlot[] = [];

  const sorted = [...slots].sort(
    (a, b) => a.seconds_from_midnight - b.seconds_from_midnight,
  );

  let i = 0;
  while (i < sorted.length) {
    const runStartSec = sorted[i].seconds_from_midnight;
    let runCount = 1;
    let j = i;

    while (
      j + 1 < sorted.length &&
      sorted[j + 1].seconds_from_midnight ===
        sorted[j].seconds_from_midnight + 1800
    ) {
      runCount++;
      j++;
    }

    if (runCount >= requiredSlots) {
      const start = runStartSec / 3600;
      const end = (runStartSec + runCount * 1800) / 3600;
      results.push({ date, start, end });
    }

    i = j + 1;
  }

  return results;
}

export async function getPlayByPointSlots(
  facilityId: string,
  dates: Date[],
  startHour: number,
  endHour: number,
  minPlaytimeHours: number,
): Promise<TimeSlot[]> {
  const requests = dates.map(async (date) => {
    const timestamp = dateToTimestamp(date);
    const data = await fetchAvailableHours(facilityId, timestamp);

    const filtered = filterSlotsInRange(data, startHour, endHour);

    const dateStr = formatDate(date);

    return findConsecutiveSlots(filtered, dateStr, minPlaytimeHours * 2);
  });

  const results = await Promise.all(requests);

  return results.flat();
}
