import fs from "fs";
import path from "path";
import { TimeSlot } from "./types.util";

const slotsFile: string = path.resolve(__dirname, "../../data/lastSlots.json");

export function generateSlotKeys(slots: TimeSlot[]): string[] {
  return slots.map((slot) => `${slot.date}-${slot.start}-${slot.end}`);
}

export function loadLastSlots(): string[] {
  if (fs.existsSync(slotsFile)) {
    return JSON.parse(fs.readFileSync(slotsFile, "utf-8"));
  }
  return [];
}

export function saveLastSlots(slots: string[]): void {
  fs.writeFileSync(slotsFile, JSON.stringify(slots, null, 2));
}

export function hasNewSlots(currentSlots: TimeSlot[]): boolean {
  const lastSlots: string[] = loadLastSlots();
  const currentSlotKeys: string[] = generateSlotKeys(currentSlots);

  if (currentSlotKeys.length !== lastSlots.length) {
    return true;
  }

  return currentSlotKeys.some((slot) => !lastSlots.includes(slot));
}

export function saveNewSlots(currentSlots: TimeSlot[]): void {
  const slotKeys: string[] = generateSlotKeys(currentSlots);
  saveLastSlots(slotKeys);
}
