import { ScanCourtSlotsOptions } from "./types.util";

export function logWithTimestamp(message: string) {
  const now: Date = new Date();
  const timestamp: string = now.toLocaleString("he-IL", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "Asia/Jerusalem",
  });
  console.log(`[${timestamp}] ${message}`);
}

export function logScanParameters(scanParameters: ScanCourtSlotsOptions) {
    console.log("Checking court availability between " + scanParameters.startDate.toDateString()
  + " and " + scanParameters.endDate.toDateString() + " from " + scanParameters.startHour + " to "
  + scanParameters.endHour + ", skipping weekends: " + scanParameters.skipWeekend);
}