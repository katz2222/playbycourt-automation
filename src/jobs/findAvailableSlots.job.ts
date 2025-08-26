import { chromium } from "@playwright/test";
import { findAvailableSlots } from "@services/findAvailableSlots.service";
import { setupAuthState } from "@src/utilities/auth.util";
import { AUTH_STATE_FILE_PATH } from "env-variables";

(async () => {
  await setupAuthState();
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    storageState: AUTH_STATE_FILE_PATH,
  });
  const page = await context.newPage();

  try {
    await findAvailableSlots(page, context);
  } catch (error) {
    console.error("Error running job:", error);
  } finally {
    await browser.close();
  }
})();
