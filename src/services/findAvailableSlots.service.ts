import { BrowserContext, Locator, Page } from "@playwright/test";
import { formatDate } from "@src/utilities/date.utils";
import { sendWhatsAppMessage } from "@src/utilities/whatsappSender.util";
import { formatCourtMessage } from "@src/utilities/general.util";
import { OrderCourtPage } from "@src/pages/orderCourtPage";
import { URL } from "env-variables";
import { HomePage } from "@src/pages/homePage";
import { hasNewSlots, saveNewSlots } from "@src/utilities/saveSlots.util";
import { TimeSlot } from "@src/utilities/types.util";

export async function findAvailableSlots(page: Page, context: BrowserContext) {
  await page.goto(URL);
  const homePage: HomePage = new HomePage(page, context);
  await homePage.openOrderCourtPage();
  const orderCourtPage: OrderCourtPage = new OrderCourtPage(page, context);
  const availableDates: Locator = orderCourtPage.getDates();
  const searchStartHour: number = 19;
  const searchEndHour: number = 22;
  const results: TimeSlot[] = [];
  const baseDate: Date = new Date();
  let countFreeSlotsStreak: number = 0;
  let freeStartHour: number | null = null;
  let date: Date = new Date(baseDate);

  await availableDates.first().waitFor();
  for (let i = 0; i < (await availableDates.count()); i++) {
    const day: number = date.getDay();
    const currentDate: Locator = availableDates.nth(i);
    await currentDate.click();
    await page.waitForTimeout(1000);

    if (day !== 5 && day !== 6) {
      const hoursSlots: Locator = orderCourtPage.getHoursSlots();
      const startSlotIndex: number | undefined =
        await orderCourtPage.findStartSlotIndex(searchStartHour);
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
            if (freeStartHour && freeEndHour) {
              const currentMessage: TimeSlot = {
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

  if (results.length > 0 && hasNewSlots(results)) {
    saveNewSlots(results);
    const fullMessage: string = formatCourtMessage(results);
    console.log(fullMessage);
    await sendWhatsAppMessage(fullMessage);
  }
}
