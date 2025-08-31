import fs from "fs";
import path from "path";

const slotsFile = path.resolve(__dirname, "lastSlots.json");

function generateSlotKeys(
  slots: { date: string; start: number; end: number }[]
): string[] {
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

export function hasNewSlots(
  currentSlots: { date: string; start: number; end: number }[]
): boolean {
  const lastSlots = loadLastSlots();
  const currentSlotKeys = generateSlotKeys(currentSlots);
  return currentSlotKeys.some((slot) => !lastSlots.includes(slot));
}

export function saveNewSlots(
  currentSlots: { date: string; start: number; end: number }[]
): void {
  const slotKeys = generateSlotKeys(currentSlots);
  saveLastSlots(slotKeys);
}
