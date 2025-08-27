import cron from "node-cron";
import { chromium } from "@playwright/test";
import { findAvailableSlots } from "@services/findAvailableSlots.service";
import { AUTH_STATE_FILE_PATH } from "env-variables";

async function runJob() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    storageState: AUTH_STATE_FILE_PATH,
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
