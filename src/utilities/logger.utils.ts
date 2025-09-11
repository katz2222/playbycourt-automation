export function logWithTimestamp(message: string) {
  const now: Date = new Date();
  const timestamp: string = now.toLocaleString("he-IL", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "Asia/Jerusalem",
  });
  console.log(`[${timestamp}] ${message}`);
}
