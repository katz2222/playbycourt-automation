export function logWithTimestamp(message: string) {
  const now = new Date();
  const timestamp = now.toLocaleString("he-IL", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "Asia/Jerusalem",
  });
  console.log(`[${timestamp}] ${message}`);
}
