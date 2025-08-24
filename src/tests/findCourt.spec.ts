import { test } from "@src/fixtures/login";
import { expect, Locator } from "@playwright/test";
import { HomePage } from "@pages/homePage";
import { URL } from "env-variables";
import { LoginPage } from "@src/pages/loginPage";
import { OrderCourtPage } from "@src/pages/orderCourtPage";
import { formatDate } from "@src/utilities/date.utils";

test("find available slots", async ({ page, context }, testInfo) => {
  testInfo.setTimeout(85000);
  await page.goto(URL);
  const loginPage: LoginPage = new LoginPage(page, context);
  await loginPage.login();
  const homePage: HomePage = new HomePage(page, context);
  await homePage.openOrderCourtPage();
  const orderCourtPage: OrderCourtPage = new OrderCourtPage(page, context);
  const availableDates: Locator = orderCourtPage.getDates();
  const serachStartHour: number = 18.5;
  const searchEndHour: number = 22;
  const baseDate = new Date();
  let countFreeSlotsStreak = 0;
  let freeStartHour: number | null = 0;
  let date = new Date(baseDate);
  await expect(availableDates).toHaveCount(15);

  for (let i = 0; i < (await availableDates.count()); i++) {
    const day = date.getDay();
    const currentDate: Locator = availableDates.nth(i);
    await currentDate.click();
    await expect(currentDate).toHaveClass(/primary/);

    if (day !== 5 && day !== 6) {
      const hoursSlots: Locator = orderCourtPage.getHoursSlots();
      const startSlotIndex: number | undefined =
        await orderCourtPage.findStartSlotIndex(serachStartHour);
      const endSlotIndex: number | undefined =
        await orderCourtPage.findLastSlotIndex(searchEndHour);

      if (startSlotIndex !== undefined && endSlotIndex !== undefined) {
        for (let j = startSlotIndex; j < endSlotIndex; j++) {
          if (await orderCourtPage.isSlotFree(hoursSlots.nth(j))) {
            freeStartHour = await orderCourtPage.getSlotStartHour(
              hoursSlots.nth(j)
            );

            while (await orderCourtPage.isSlotFree(hoursSlots.nth(j))) {
              countFreeSlotsStreak++;
              j++;
            }
          }

          if (countFreeSlotsStreak > 2) {
            const freeEndHour: number | null =
              await orderCourtPage.getSlotStartHour(hoursSlots.nth(j));

            console.log(
              `free court in ${formatDate(
                date
              )} between ${freeStartHour} to ${freeEndHour}`
            );
          }
          countFreeSlotsStreak = 0;
        }
      }
    }
    date.setDate(date.getDate() + 1);
  }
});
