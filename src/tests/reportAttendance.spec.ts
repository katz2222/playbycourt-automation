import { test } from "@src/fixtures/login";
import { expect, Locator } from "@playwright/test";
import { HomePage } from "@pages/homePage";
import { CalendarReportsPage } from "@pages/calendarReportsPage";
import { ReportAttendanceMainPage } from "@src/pages/reportAttendanceMainPage";
import { ReportAttendancePage } from "@pages/ReportAttendancePage";
import { FinishReportPage } from "@src/pages/finishReportPage";
import { URL } from "env-variables";

test("report attendance for whole week", async ({
  page,
  context,
}, testInfo) => {
  testInfo.setTimeout(85000);

  await page.goto(URL);
  const reportOption: string = "נוכח/ת";
  const homePage: HomePage = new HomePage(page, context);
  await expect(homePage.getHomePageButton()).toBeVisible();
  await homePage.navigateToFutureReports();
  const futureReportsPage: CalendarReportsPage = new CalendarReportsPage(
    page,
    context
  );
  const midweekEnabledButtons: Locator =
    futureReportsPage.getMidweekEnabledButtons();
  await expect(midweekEnabledButtons).toHaveCount(5);
  const reportAttendanceMainPage: ReportAttendanceMainPage =
    new ReportAttendanceMainPage(page, context);
  const reportAttendancePage: ReportAttendancePage = new ReportAttendancePage(
    page,
    context
  );
  const finishReportPage: FinishReportPage = new FinishReportPage(
    page,
    context
  );

  for (let i = 0; i < (await midweekEnabledButtons.count()); i++) {
    await midweekEnabledButtons.nth(i).click();
    await reportAttendanceMainPage.clickInUnit();
    await reportAttendancePage.selectReportOption(reportOption);
    await reportAttendancePage.sendReport();
    await finishReportPage.closePage();
  }
});
