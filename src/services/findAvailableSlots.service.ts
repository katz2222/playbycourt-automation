import { BrowserContext, chromium, Page } from "@playwright/test";
import { formatDate } from "@src/utilities/date.utils";
import { sendWhatsAppMessage } from "@src/utilities/whatsappSender.util";
import { formatCourtMessage } from "@src/utilities/general.util";
import { OrderCourtPage } from "@src/pages/orderCourtPage";
import { URL } from "env-variables";
import { HomePage } from "@src/pages/homePage";

export async function findAvailableSlots(page: Page, context: BrowserContext) {
  await page.goto(URL);
  const homePage: HomePage = new HomePage(page, context);
  await homePage.openOrderCourtPage();
  const orderCourtPage: OrderCourtPage = new OrderCourtPage(page, context);
  const availableDates = orderCourtPage.getDates();
  const serachStartHour = 19;
  const searchEndHour = 22;
  const results: { date: string; start: number; end: number }[] = [];
  const baseDate = new Date();
  let countFreeSlotsStreak = 0;
  let freeStartHour: number | null = null;
  let date = new Date(baseDate);

  await availableDates.first().waitFor();
  for (let i = 0; i < (await availableDates.count()); i++) {
    const day = date.getDay();
    const currentDate = availableDates.nth(i);
    await currentDate.click();
    await page.waitForTimeout(1000);

    if (day !== 5 && day !== 6) {
      const hoursSlots = orderCourtPage.getHoursSlots();
      const startSlotIndex = await orderCourtPage.findStartSlotIndex(
        serachStartHour
      );
      const endSlotIndex = await orderCourtPage.findLastSlotIndex(
        searchEndHour
      );

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
            const freeEndHour = await orderCourtPage.getSlotStartHour(
              hoursSlots.nth(j)
            );
            if (freeStartHour && freeEndHour) {
              const currentMessage: {
                date: string;
                start: number;
                end: number;
              } = {
                date: formatDate(date),
                start: freeStartHour,
                end: freeEndHour,
              };
              results.push(currentMessage);
            }
          }
          countFreeSlotsStreak = 0;
        }
      }
    }
    date.setDate(date.getDate() + 1);
  }

  if (results.length > 0) {
    const fullMessage = formatCourtMessage(results);
    console.log(fullMessage);
    await sendWhatsAppMessage(fullMessage);
  }
}
