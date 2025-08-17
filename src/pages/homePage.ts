import { BrowserContext, Page, Locator } from "@playwright/test";
import { Navbar } from "./navbar";
export class HomePage extends Navbar {
  // Locators
  protected page: Page;
  protected context: BrowserContext;
  private futureReportsButton: Locator;

  // Constuctor
  constructor(page: Page, context: BrowserContext) {
    super(page, context);
    this.page = page;
    this.context = context;
    this.futureReportsButton = page.getByText("דיווחים עתידיים");
  }

  // Getters
  getFutureReportsButton(): Locator {
    return this.futureReportsButton;
  }

  // Methods
  async navigateToFutureReports(): Promise<void> {
    await this.getFutureReportsButton().click();
  }
}
