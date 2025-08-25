import { test } from "@src/fixtures/login";
import { expect, Locator } from "@playwright/test";
import { formatDate } from "@src/utilities/date.utils";
import { sendWhatsAppMessage } from "@src/utilities/whatsappSender.util";
import { formatCourtMessage } from "@src/utilities/general.util";

test("find available slots", async ({
  page,
  context,
  orderCourtPage,
}, testInfo) => {
  testInfo.setTimeout(85000);
  const availableDates: Locator = orderCourtPage.getDates();
  const serachStartHour: number = 17.5;
  const searchEndHour: number = 22;
  const results: { date: string; start: number; end: number }[] = [];
  const baseDate = new Date();
  let countFreeSlotsStreak = 0;
  let freeStartHour: number | null = null;
  let date = new Date(baseDate);
  await expect(availableDates).toHaveCount(15);

  for (let i = 0; i < (await availableDates.count()); i++) {
    const day = date.getDay();
    const currentDate: Locator = availableDates.nth(i);
    await currentDate.click();
    await page.waitForTimeout(1000);

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
});
