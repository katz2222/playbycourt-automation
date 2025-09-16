import fs from "fs/promises";
import moment from "moment";
import "../../env-variables";
import {
  URL,
  AUTH_STATE_FILE_PATH,
  AUTH_STATE_DATE_FILE_NAME,
} from "../../env-variables";
import {
  Browser,
  BrowserContext,
  chromium,
  expect,
  Locator,
  Page,
} from "@playwright/test";
import { isFileExists } from "@utils/file-management.util";
import { LoginPage } from "@src/pages/loginPage";
import { HomePage } from "@src/pages/homePage";

export interface State {
  lastRun: string;
}

const authLogin = async () => {
  const browser: Browser = await chromium.launch({
    headless: false,
  });

  const context: BrowserContext = await browser.newContext();
  const page: Page = await context.newPage();

  await page.goto(URL);
  const loginPage: LoginPage = new LoginPage(page, context);
  await loginPage.login();
  const homePage: HomePage = new HomePage(page, context);
  const homePageButton: Locator = homePage.getHomePageButton();
  await expect(homePageButton).toBeVisible();
  await page.waitForURL(URL, {
    timeout: 120000,
  });
  await context.storageState({ path: AUTH_STATE_FILE_PATH });
  await browser.close();
};

const isAuthExpired = async () => {
  const fileData = await fs.readFile("state.json");
  const obj: State = JSON.parse(fileData.toString());
  const lastRun = moment(obj.lastRun, moment.ISO_8601).add(50, "minutes");
  const now = moment();
  return false; // TODO: Fix this logic to actually check if the auth is expired
  return lastRun.isBefore(now);
};

const writeNewAuthStateDateToFile = async () => {
  const dataToWrite: State = {
    lastRun: moment().toISOString(),
  };
  await fs.writeFile(AUTH_STATE_DATE_FILE_NAME, JSON.stringify(dataToWrite));
};

const writeExpiredAuthDateState = async () => {
  const dataToWrite: State = {
    lastRun: moment().subtract(1, "hour").toISOString(),
  };
  await fs.writeFile(AUTH_STATE_DATE_FILE_NAME, JSON.stringify(dataToWrite));
};

const setupAuthState = async () => {
  let isStateFileExists = await isFileExists(AUTH_STATE_DATE_FILE_NAME);
  if (!isStateFileExists) {
    await writeExpiredAuthDateState();
  }

  if (await isAuthExpired()) {
    await authLogin();
    await writeNewAuthStateDateToFile();
  }
  console.log("Auth generation was successful");
};

export { setupAuthState };
