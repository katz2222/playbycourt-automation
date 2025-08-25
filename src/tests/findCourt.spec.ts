import { test } from "@src/fixtures/login";
import { expect, Locator } from "@playwright/test";
import { HomePage } from "@pages/homePage";
import { OrderCourtPage } from "@src/pages/orderCourtPage";
import { formatDate } from "@src/utilities/date.utils";
import { sendWhatsAppMessage } from "@src/utilities/whatsappSender.util";

test("find available slots", async ({
  page,
  context,
  orderCourtPage,
}, testInfo) => {
  testInfo.setTimeout(85000);
  const availableDates: Locator = orderCourtPage.getDates();
  const serachStartHour: number = 17.5;
  const searchEndHour: number = 22;
  const results: string[] = [];
  const baseDate = new Date();
  let countFreeSlotsStreak = 0;
  let freeStartHour: number | null = null;
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
            const currentMessage: string = `free court on ${formatDate(
              date
            )} between ${freeStartHour} to ${freeEndHour}`;
            results.push(currentMessage);
            console.log(currentMessage);
          }
          countFreeSlotsStreak = 0;
        }
      }
    }
    date.setDate(date.getDate() + 1);
  }

  if (results.length > 0) {
    const fullMessage = `✅ Free court slots found:\n\n${results.join("\n")}`;
    await sendWhatsAppMessage(fullMessage);
  }
});
