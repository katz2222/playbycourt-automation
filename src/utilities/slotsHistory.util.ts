import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { SlotHistoryRecord, TimeSlot } from "./types.util";
import {
  formatHourDecimalToTimeString,
  getCurrentDateTime,
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
        start: Number(row.start),
        end: Number(row.end),
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
  currentSlots: TimeSlot[],
  existingKeys: Set<string>
): void {
  const now: string = getCurrentDateTime();

  for (const slot of currentSlots) {
    const key: string = slotKey(slot);
    const alreadyExists: boolean = existingKeys.has(key);

    if (!alreadyExists) {
      const newRecord: SlotHistoryRecord = {
        TimeSlot: slot,
        becameAvailableAt: now,
      };
      records.push(newRecord);
    }
  }
}

function sortSlotHistoryRecords(records: SlotHistoryRecord[]): void {
  records.sort((a: SlotHistoryRecord, b: SlotHistoryRecord): number => {
    const dateCompare: number = a.TimeSlot.date.localeCompare(b.TimeSlot.date);
    if (dateCompare !== 0) return dateCompare;
    return a.TimeSlot.start - b.TimeSlot.start;
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
  const existingKeys: Set<string> = new Set(
    records.map((r: SlotHistoryRecord) => slotKey(r.TimeSlot))
  );

  markUnavailableSlots(records, currentSlotKeys);
  addNewSlots(records, currentSlots, existingKeys);
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
