import { BrowserContext, Locator, Page } from "@playwright/test";
import {
  formatDate,
  isWeekend,
  searchFromDate,
} from "@src/utilities/date.utils";
import { sendWhatsAppMessage } from "@src/utilities/whatsappSender.util";
import { formatCourtMessage } from "@src/utilities/general.util";
import { OrderCourtPage } from "@src/pages/orderCourtPage";
import { URL } from "env-variables";
import { HomePage } from "@src/pages/homePage";
import { SlotHistoryRecord, TimeSlot } from "@src/utilities/types.util";
import {
  findNewSlots,
  loadSlotHistory,
  updateSlotHistoryExcel,
} from "@src/utilities/slotsHistory.util";

export async function findAvailableSlots(page: Page, context: BrowserContext) {
  await page.goto(URL);
  const homePage: HomePage = new HomePage(page, context);
  await homePage.openOrderCourtPage();
  const orderCourtPage: OrderCourtPage = new OrderCourtPage(page, context);
  const datesUi: Locator = orderCourtPage.getDates();
  const searchStartHour: number = 19;
  const searchEndHour: number = 22.5;
  const availableTimeSlots: TimeSlot[] = [];
  let freeSlotsStreak: number = 0;
  let freeStartHour: number | null = null;
  let currentSearchDate: Date = searchFromDate();

  await datesUi.first().waitFor();
  for (let i = 0; i < (await datesUi.count()); i++) {
    const day: number = currentSearchDate.getDay();
    const currentDateUi: Locator = datesUi.nth(i);
    await currentDateUi.click();
    await page.waitForTimeout(1000);

    if (!isWeekend(day)) {
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

            while (
              (await orderCourtPage.isSlotFree(hoursSlots.nth(j))) &&
              j < endSlotIndex
            ) {
              freeSlotsStreak++;
              j++;
            }
          }

          if (freeSlotsStreak > 2) {
            const freeEndHour: number | null =
              await orderCourtPage.getSlotStartHour(hoursSlots.nth(j));
            if (freeStartHour && freeEndHour) {
              const availableTimeSlot: TimeSlot = {
                date: formatDate(currentSearchDate),
                start: freeStartHour,
                end: freeEndHour,
              };
              availableTimeSlots.push(availableTimeSlot);
            }
          }
          freeSlotsStreak = 0;
        }
      }
    }
    currentSearchDate.setDate(currentSearchDate.getDate() + 1);
  }

  const previousRecords: SlotHistoryRecord[] = loadSlotHistory();
  const newSlots: TimeSlot[] = findNewSlots(
    availableTimeSlots,
    previousRecords
  );
  const message: string = formatCourtMessage(availableTimeSlots);
  console.log(message);

  if (newSlots.length > 0) {
    // await sendWhatsAppMessage(message);
    console.log("New slots found, sending message.");
  } else {
    console.log("No new slots found, not sending message.");
  }

  updateSlotHistoryExcel(availableTimeSlots);
}
