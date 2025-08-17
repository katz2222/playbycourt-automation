import { BrowserContext, Page, Locator } from "@playwright/test";
export class ReportAttendanceNavbar {
  // Locators
  protected page: Page;
  protected context: BrowserContext;
  private backButton: Locator;
  private xButton: Locator;

  // Constuctor
  constructor(page: Page, context: BrowserContext) {
    this.page = page;
    this.context = context;
    this.backButton = page.locator(".backBtn");
    this.xButton = page.locator(".closeBtn");
  }

  // Getters
  getBackButton(): Locator {
    return this.backButton;
  }

  getXButton(): Locator {
    return this.xButton;
  }

  // Methods
  async goBack(): Promise<void> {
    await this.getBackButton().click();
  }

  async closeMenu(): Promise<void> {
    await this.getXButton().click();
  }
}
