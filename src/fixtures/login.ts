import { test as base, expect, Locator } from "@playwright/test";
import { URL } from "env-variables";
import { HomePage } from "@pages/homePage";
import { LoginPage } from "@pages/loginPage";
import { OrderCourtPage } from "@src/pages/orderCourtPage";

export const test = base.extend<{
  login: HomePage;
  orderCourtPage: OrderCourtPage;
}>({
  login: [
    async ({ page, context }, use) => {
      const loginPage: LoginPage = new LoginPage(page, context);
      await page.goto(URL);
      await loginPage.login();
      const homePage: HomePage = new HomePage(page, context);
      const homePageButton: Locator = homePage.getHomePageButton();
      await expect(homePageButton).toBeVisible({ timeout: 60000 });
      await use(homePage);
    },
    { timeout: 70000 },
  ],

  orderCourtPage: [
    async ({ page, context }, use) => {
      await page.goto(URL);
      const homePage: HomePage = new HomePage(page, context);
      await homePage.openOrderCourtPage();
      const orderCourtPage: OrderCourtPage = new OrderCourtPage(page, context);
      await use(orderCourtPage);
    },
    { timeout: 70000 },
  ],
});
