import { BrowserContext, Page, Locator } from "@playwright/test";
import { ReportAttendanceNavbar } from "./reportAttendanceNavbar";
export class ReportAttendanceMainPage extends ReportAttendanceNavbar {
  // Locators
  private inUnit: Locator;
  private vacation: Locator;
  private abroad: Locator;
  private outsideUnit: Locator;
  private sickLeave: Locator;
  private emergencyReport: Locator;

  // Constuctor
  constructor(page: Page, context: BrowserContext) {
    super(page, context);
    this.inUnit = page.getByText("נמצא/ת ביחידה");
    this.vacation = page.getByText("חופשה שנתית");
    this.abroad = page.getByText('"חו"ל"');
    this.outsideUnit = page.getByText("מחוץ ליחידה");
    this.sickLeave = page.getByText("חופשת מחלה");
    this.emergencyReport = page.getByText("דיווחי חירום");
  }

  // Getters
  getInUnit(): Locator {
    return this.inUnit;
  }

  getVacation(): Locator {
    return this.vacation;
  }

  getAbroad(): Locator {
    return this.abroad;
  }

  getOutsideUnit(): Locator {
    return this.outsideUnit;
  }

  getSickLeave(): Locator {
    return this.sickLeave;
  }

  getEmergencyReport(): Locator {
    return this.emergencyReport;
  }

  // Methods
  async clickInUnit(): Promise<void> {
    await this.getInUnit().click();
  }
}
