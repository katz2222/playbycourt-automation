import cron from "node-cron";
import { chromium } from "@playwright/test";
import { findAvailableSlots } from "@services/findAvailableSlots.service";
import { AUTH_STATE_FILE_PATH } from "env-variables";

async function runJob() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: AUTH_STATE_FILE_PATH,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
    viewport: { width: 1366, height: 768 },
    locale: "en-US",
  });
  const page = await context.newPage();

  try {
    console.log(`[${new Date().toISOString()}] Running job...`);
    await findAvailableSlots(page, context);
  } catch (error) {
    console.error("Error running job:", error);
  } finally {
    await browser.close();
  }
}

cron.schedule("*/5 * * * *", runJob);
