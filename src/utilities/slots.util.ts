import { fetchAvailableHours } from "./api.util";
import { dateToTimestamp, formatDate, generateDateRange } from "./date.utils";
import { ScanCourtSlotsOptions, TimeSlot } from "./types.util";

function filterSlotsInRange(
  slots: any[],
  startHour: number,
  endHour: number
) {
  const start = startHour * 3600;
  const end = endHour * 3600;

  return slots.filter(
    (s) =>
      s.available &&
      s.seconds_from_midnight >= start &&
      s.seconds_from_midnight < end
  );
}

export function findConsecutiveSlots(slots: any[], date: string): TimeSlot[] {
  const results: TimeSlot[] = [];
  const requiredSlots = 3;

  const sorted = [...slots].sort(
    (a, b) => a.seconds_from_midnight - b.seconds_from_midnight
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

export async function scanCourtSlots(
  opts: ScanCourtSlotsOptions
): Promise<TimeSlot[]> {
  const {
    startDate,
    endDate,
    startHour,
    endHour,
    skipWeekend,
    skipWeekdays,
  } = opts;

  const dates = generateDateRange(startDate, endDate, {
    skipWeekend,
    skipWeekdays,
  });

  const requests = dates.map(async (date) => {
    const timestamp = dateToTimestamp(date);
    const data = await fetchAvailableHours(timestamp);

    const filtered = filterSlotsInRange(
      data.available_hours,
      startHour,
      endHour
    );

    const dateStr = formatDate(date);

    return findConsecutiveSlots(filtered, dateStr);
  });

  const results = await Promise.all(requests);

  return results.flat();
}