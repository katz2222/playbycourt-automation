import { BrowserContext, Page, Locator } from "@playwright/test";
export class FinishReportPage {
  // Locators
  protected page: Page;
  protected context: BrowserContext;
  private xButton: Locator;
  private editReportButton: Locator;
  private deleteReportButton: Locator;

  // Constuctor
  constructor(page: Page, context: BrowserContext) {
    this.page = page;
    this.context = context;
    this.xButton = page.locator(".xBtn");
    this.editReportButton = page.getByText("עריכת דיווח");
    this.deleteReportButton = page.getByText("מחיקת דיווח");
  }

  // Getters
  getXButton(): Locator {
    return this.xButton;
  }

  getEditReportButton(): Locator {
    return this.editReportButton;
  }
  getDeleteReportButton(): Locator {
    return this.deleteReportButton;
  }

  // Methods
  async closePage(): Promise<void> {
    await this.getXButton().click();
  }

  async editReport(): Promise<void> {
    await this.getEditReportButton().click();
  }

  async deleteReport(): Promise<void> {
    await this.getDeleteReportButton().click();
  }
}
