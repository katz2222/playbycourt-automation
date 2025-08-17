import { test as base, expect } from "@playwright/test";
import { URL } from "env-variables";
import { HomePage } from "@pages/homePage";
import { LoginPage } from "@pages/loginPage";

export const test = base.extend<{
  login: HomePage;
}>({
  login: [
    async ({ page, context }, use) => {
      const loginPage = new LoginPage(page, context);
      await page.goto(URL);
      await loginPage.login();
      const homePage = new HomePage(page, context);
      const homePageButton = homePage.getHomePageButton();
      await expect(homePageButton).toBeVisible({ timeout: 60000 });
      await use(homePage);
    },
    { timeout: 70000 },
  ],
});
