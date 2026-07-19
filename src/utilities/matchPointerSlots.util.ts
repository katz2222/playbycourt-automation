import { DayTimeRange, TimeRange, TimeSlot } from "./types.util";
import {
  fetchVenueDetails,
  fetchActiveCourts,
  fetchReservations,
} from "./matchPointerApi.util";
import {
  formatDate,
  formatDateISO,
  formatHourDecimalToTimeString,
  parseHourStringToDecimal,
} from "./date.utils";

/**
 * Get opening hour ranges for a specific date based on the venue's opening hours config.
 * Uses date.getDay() to get 0=Sunday through 6=Saturday.
 */
export function getOpeningHoursForDate(
  date: Date,
  openingHours: DayTimeRange[],
): TimeRange[] {
  const dayOfWeek = date.getDay();
  const dayConfig = openingHours.find((d) => d.day === dayOfWeek);

  if (!dayConfig || !dayConfig.isOpen) {
    return [];
  }

  return dayConfig.ranges;
}

/**
 * Derive available time slots by subtracting reservations from opening ranges.
 * Both inputs and outputs use "HH:MM" string format.
 */
export function deriveAvailableSlots(
  openingRanges: TimeRange[],
  reservations: TimeRange[],
): TimeRange[] {
  if (openingRanges.length === 0) {
    return [];
  }

  // Convert reservations to decimal and sort by start time
  const sortedReservations = reservations
    .map((r) => ({
      start: parseHourStringToDecimal(r.start),
      end: parseHourStringToDecimal(r.end),
    }))
    .sort((a, b) => a.start - b.start);

  const result: TimeRange[] = [];

  for (const range of openingRanges) {
    let currentStart = parseHourStringToDecimal(range.start);
    const rangeEnd = parseHourStringToDecimal(range.end);

    for (const reservation of sortedReservations) {
      // Skip reservations that end before or at current start
      if (reservation.end <= currentStart) {
        continue;
      }

      // Stop if reservation starts at or after range end
      if (reservation.start >= rangeEnd) {
        break;
      }

      // There's a gap before this reservation
      if (reservation.start > currentStart) {
        const slotEnd = Math.min(reservation.start, rangeEnd);
        if (slotEnd > currentStart) {
          result.push({
            start: formatHourDecimalToTimeString(currentStart),
            end: formatHourDecimalToTimeString(slotEnd),
          });
        }
      }

      // Move current start past this reservation
      currentStart = Math.max(currentStart, reservation.end);
    }

    // Remaining time after all reservations
    if (currentStart < rangeEnd) {
      result.push({
        start: formatHourDecimalToTimeString(currentStart),
        end: formatHourDecimalToTimeString(rangeEnd),
      });
    }
  }

  return result;
}

/**
 * Filter/clip time ranges to fit within [startHour, endHour].
 * startHour and endHour are decimal (e.g., 8.5 = 08:30).
 */
export function filterByHourRange(
  slots: TimeRange[],
  startHour: number,
  endHour: number,
): TimeRange[] {
  const result: TimeRange[] = [];

  for (const slot of slots) {
    const slotStart = parseHourStringToDecimal(slot.start);
    const slotEnd = parseHourStringToDecimal(slot.end);

    // Completely outside the range
    if (slotEnd <= startHour || slotStart >= endHour) {
      continue;
    }

    // Clip to the intersection
    const clippedStart = Math.max(slotStart, startHour);
    const clippedEnd = Math.min(slotEnd, endHour);

    if (clippedEnd > clippedStart) {
      result.push({
        start: formatHourDecimalToTimeString(clippedStart),
        end: formatHourDecimalToTimeString(clippedEnd),
      });
    }
  }

  return result;
}

/**
 * Remove slots where no valid booking of at least minPlaytimeHours is possible.
 * MatchPointer valid booking durations: 1, 1.5, 2 hours.
 * Constraint: leftover after booking must be 0 or >= 1h (no gaps < 1h allowed).
 * A block passes if ANY valid duration d >= minPlaytimeHours fits with valid leftover.
 */
export function filterByMinPlaytime(
  slots: TimeRange[],
  minPlaytimeHours: number,
): TimeRange[] {
  const validDurations = [1, 1.5, 2];

  return slots.filter((slot) => {
    const blockDuration =
      Math.round(
        (parseHourStringToDecimal(slot.end) -
          parseHourStringToDecimal(slot.start)) *
          60,
      ) / 60;

    return validDurations.some((d) => {
      if (d < minPlaytimeHours) return false;
      if (d > blockDuration) return false;
      const leftover = Math.round((blockDuration - d) * 60) / 60;
      return leftover === 0 || leftover >= 1;
    });
  });
}

/**
 * Convert TimeRange[] (string "HH:MM") to TimeSlot[] (decimal hours).
 */
export function timeRangesToTimeSlots(
  ranges: TimeRange[],
  date: string,
): TimeSlot[] {
  return ranges.map((range) => ({
    date,
    start: parseHourStringToDecimal(range.start),
    end: parseHourStringToDecimal(range.end),
  }));
}

/**
 * Merge overlapping/adjacent time ranges into a unified set.
 * Used to union per-court availability (a slot is available if ANY court is free).
 */
export function mergeTimeRanges(ranges: TimeRange[]): TimeRange[] {
  if (ranges.length === 0) return [];

  const decimal = ranges
    .map((r) => ({
      start: parseHourStringToDecimal(r.start),
      end: parseHourStringToDecimal(r.end),
    }))
    .sort((a, b) => a.start - b.start);

  const merged: { start: number; end: number }[] = [decimal[0]];

  for (let i = 1; i < decimal.length; i++) {
    const last = merged[merged.length - 1];
    const curr = decimal[i];

    if (curr.start <= last.end) {
      // Overlapping or adjacent — extend
      last.end = Math.max(last.end, curr.end);
    } else {
      merged.push(curr);
    }
  }

  return merged.map((r) => ({
    start: formatHourDecimalToTimeString(r.start),
    end: formatHourDecimalToTimeString(r.end),
  }));
}

const DAY_NAME_TO_NUMBER: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

/**
 * Normalize the raw MatchPointer opening_hours response into our DayTimeRange[] format.
 * The API returns: [{ day: "Sunday", isOpen: true, timeRanges: [{openTime, closeTime}] }]
 * We need:         [{ day: 0,        isOpen: true, ranges: [{start, end}] }]
 */
function normalizeOpeningHours(raw: unknown): DayTimeRange[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((entry: any) => ({
    day: DAY_NAME_TO_NUMBER[entry.day] ?? -1,
    isOpen: entry.isOpen ?? false,
    ranges: (entry.timeRanges || []).map((r: any) => ({
      start: r.openTime,
      end: r.closeTime,
    })),
  }));
}

/**
 * Orchestrator: fetches venue data, courts, and reservations, then derives
 * available slots for the given dates filtered by hour range and min playtime.
 */
export async function getMatchPointerSlots(
  venueId: string,
  dates: Date[],
  startHour: number,
  endHour: number,
  minPlaytimeHours: number,
): Promise<TimeSlot[]> {
  const venue = await fetchVenueDetails(venueId);
  const openingHours = normalizeOpeningHours(venue.opening_hours);

  const courts = await fetchActiveCourts(venueId);
  if (courts.length === 0) {
    return [];
  }

  const courtIds = courts.map((c) => c.id);

  // Fetch all reservations in one request for the full date range
  const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const startDate = formatDateISO(sortedDates[0]);
  const endDate = formatDateISO(sortedDates[sortedDates.length - 1]);
  const allReservations = await fetchReservations(courtIds, startDate, endDate);

  // Group reservations by date AND court
  const reservationsByDateAndCourt = new Map<string, TimeRange[]>();
  for (const r of allReservations) {
    const key = `${r.date}|${r.court_id}`;
    const ranges = reservationsByDateAndCourt.get(key) || [];
    ranges.push({ start: r.start_time, end: r.end_time });
    reservationsByDateAndCourt.set(key, ranges);
  }

  const allSlots: TimeSlot[] = [];

  for (const date of dates) {
    // Get opening hours for this day of the week
    const dayRanges = getOpeningHoursForDate(date, openingHours);
    if (dayRanges.length === 0) {
      continue;
    }

    const dateStr = formatDateISO(date);

    // Derive available slots per court, apply filters per court, then merge
    const filteredPerCourt: TimeRange[][] = courtIds.map((courtId) => {
      const key = `${dateStr}|${courtId}`;
      const courtReservations = reservationsByDateAndCourt.get(key) || [];
      let courtSlots = deriveAvailableSlots(dayRanges, courtReservations);
      courtSlots = filterByHourRange(courtSlots, startHour, endHour);
      courtSlots = filterByMinPlaytime(courtSlots, minPlaytimeHours);
      return courtSlots;
    });

    // Union all per-court results (merge overlapping ranges)
    let availableSlots = mergeTimeRanges(filteredPerCourt.flat());

    // Convert to TimeSlots using the formatted date string
    const formattedDate = formatDate(date);
    const timeSlots = timeRangesToTimeSlots(availableSlots, formattedDate);
    allSlots.push(...timeSlots);
  }

  return allSlots;
}
