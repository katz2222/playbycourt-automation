import { ScanCourtSlotsOptions } from "./types.util";

export function logWithTimestamp(message: string): void {
  const now: Date = new Date();
  const timestamp: string = now.toLocaleString("he-IL", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "Asia/Jerusalem",
  });
  console.log(`[${timestamp}] ${message}`);
}

export function logScanParameters(scanParameters: ScanCourtSlotsOptions): void {
  if (scanParameters.specificDates) {
    const dateStrs = scanParameters.specificDates
      .map((d) => d.toDateString())
      .join(", ");
    console.log(
      `Checking court availability for specific dates: ${dateStrs} from ${scanParameters.startHour} to ${scanParameters.endHour}`,
    );
  } else {
    console.log(
      "Checking court availability between " +
        scanParameters.startDate.toDateString() +
        " and " +
        scanParameters.endDate.toDateString() +
        " from " +
        scanParameters.startHour +
        " to " +
        scanParameters.endHour +
        ", skipping weekends: " +
        scanParameters.skipWeekend,
    );
  }
}
