import { BrowserContext, Page, Locator } from "@playwright/test";
import { ReportAttendanceNavbar } from "./reportAttendanceNavbar";
export class ReportAttendancePage extends ReportAttendanceNavbar {
  // Locators
  private reportOptions: Locator;
  private addNoteButtons: Locator;
  private notesInput: Locator;
  private sendReportButton: Locator;

  // Constuctor
  constructor(page: Page, context: BrowserContext) {
    super(page, context);
    this.reportOptions = page.locator(".btnRadioRow");
    this.addNoteButtons = page.locator(".noteBtn");
    this.notesInput = page.getByPlaceholder(
      "הזן הערה לדיווח הנוכחות (אופציונלי)"
    );
    this.sendReportButton = page.getByText("שליחת דיווח");
  }

  // Getters
  getReportOptions(): Locator {
    return this.reportOptions;
  }
  getAddNoteButtons(): Locator {
    return this.addNoteButtons;
  }

  getNotesInput(): Locator {
    return this.notesInput;
  }
  getSendReportButton(): Locator {
    return this.sendReportButton;
  }

  // Methods
  async sendReport(): Promise<void> {
    await this.getSendReportButton().click();
  }

  async selectReportOption(option: string): Promise<void> {
    const reportOptions = this.getReportOptions();
    await reportOptions.getByText(option).click();
  }

  async addNoteForOption(option: string, note: string): Promise<void> {
    await this.selectReportOption(option);
    await this.getNotesInput().fill(note);
    await this.getSendReportButton().click();
  }
}
