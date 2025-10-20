import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { SlotHistoryRecord, TimeSlot } from "./types.util";
import {
  formatHourDecimalToTimeString,
  getCurrentDateTime,
  parseHourStringToDecimal,
  smartParseDate,
} from "./date.utils";

const historyFilePath: string = path.resolve(
  __dirname,
  "../../data/slot_history.xlsx"
);
const sheetName: string = "Slot History";

function slotKey(row: TimeSlot): string {
  return `${row.date}-${row.start}-${row.end}`;
}

export function loadSlotHistory(): SlotHistoryRecord[] {
  if (!fs.existsSync(historyFilePath)) return [];

  const workbook: XLSX.WorkBook = XLSX.readFile(historyFilePath);
  const sheet: XLSX.WorkSheet = workbook.Sheets[sheetName];
  const flatRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet);

  const records: SlotHistoryRecord[] = flatRows.map(
    (row: Record<string, any>): SlotHistoryRecord => ({
      TimeSlot: {
        date: row.date,
        start: parseHourStringToDecimal(row.start),
        end: parseHourStringToDecimal(row.end),
      },
      becameAvailableAt: row.becameAvailableAt,
      becameUnavailableAt: row.becameUnavailableAt || undefined,
    })
  );

  return records;
}

function markUnavailableSlots(
  records: SlotHistoryRecord[],
  currentSlotKeys: Set<string>
): void {
  const now: string = getCurrentDateTime();

  for (const record of records) {
    const key: string = slotKey(record.TimeSlot);
    const isCurrentlyAvailable: boolean = currentSlotKeys.has(key);

    if (!isCurrentlyAvailable && !record.becameUnavailableAt) {
      record.becameUnavailableAt = now;
    }
  }
}

function addNewSlots(
  records: SlotHistoryRecord[],
  currentSlots: TimeSlot[]
): void {
  const now: string = getCurrentDateTime();
  const activeKeys = new Set(
    records
      .filter((r) => !r.becameUnavailableAt)
      .map((r) => slotKey(r.TimeSlot))
  );

  for (const slot of currentSlots) {
    const key = slotKey(slot);
    if (!activeKeys.has(key)) {
      records.push({
        TimeSlot: slot,
        becameAvailableAt: now,
      });
    }
  }
}

function sortSlotHistoryRecords(records: SlotHistoryRecord[]): void {
  records.sort((a, b) => {
    const dateA: Date = smartParseDate(a.TimeSlot.date, a.becameAvailableAt);
    const dateB: Date = smartParseDate(b.TimeSlot.date, b.becameAvailableAt);

    const timeCompare: number = dateB.getTime() - dateA.getTime();
    if (timeCompare !== 0) return timeCompare;

    return b.TimeSlot.start - a.TimeSlot.start;
  });
}

function writeSlotHistory(records: SlotHistoryRecord[]): void {
  sortSlotHistoryRecords(records);

  const flatRows: Record<string, string | number>[] = records.map(
    (r: SlotHistoryRecord) => ({
      date: r.TimeSlot.date,
      start: formatHourDecimalToTimeString(r.TimeSlot.start),
      end: formatHourDecimalToTimeString(r.TimeSlot.end),
      becameAvailableAt: r.becameAvailableAt,
      becameUnavailableAt: r.becameUnavailableAt ?? "",
    })
  );

  const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(flatRows, {
    header: [
      "date",
      "start",
      "end",
      "becameAvailableAt",
      "becameUnavailableAt",
    ],
  });

  const workbook: XLSX.WorkBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Slot History");
  XLSX.writeFile(workbook, historyFilePath);
}

export function updateSlotHistoryExcel(currentSlots: TimeSlot[]): void {
  const currentSlotKeys: Set<string> = new Set(currentSlots.map(slotKey));
  const records: SlotHistoryRecord[] = loadSlotHistory();
  markUnavailableSlots(records, currentSlotKeys);
  addNewSlots(records, currentSlots);
  writeSlotHistory(records);
}

/**
 * Returns only the slots that are newly available compared to the history records.
 */
export function findNewSlots(
  currentSlots: TimeSlot[],
  historyRecords: SlotHistoryRecord[]
): TimeSlot[] {
  const activeSlotKeys: Set<string> = new Set(
    historyRecords
      .filter((r) => !r.becameUnavailableAt)
      .map((r) => slotKey(r.TimeSlot))
  );

  const newSlots: TimeSlot[] = currentSlots.filter(
    (slot) => !activeSlotKeys.has(slotKey(slot))
  );

  return newSlots;
}

export function hasAnySlotBecomeUnavailable(
  currentSlots: TimeSlot[],
  previousRecords: SlotHistoryRecord[]
): boolean {
  const currentSlotKeys = new Set(currentSlots.map(slotKey));

  return previousRecords.some((record) => {
    const key = slotKey(record.TimeSlot);
    return !record.becameUnavailableAt && !currentSlotKeys.has(key);
  });
}
