import { BrowserContext, Page, Locator } from "@playwright/test";
import { Navbar } from "./navbar";
export class CalendarReportsPage extends Navbar {
  // Locators
  protected page: Page;
  protected context: BrowserContext;
  private MidweekEnabledButtons: Locator;

  // Constuctor
  constructor(page: Page, context: BrowserContext) {
    super(page, context);
    this.page = page;
    this.context = context;
    this.MidweekEnabledButtons = page.locator(
      ".react-calendar__tile:enabled:not(.react-calendar__month-view__days__day--weekend)"
    );
  }

  // Getters
  getMidweekEnabledButtons(): Locator {
    return this.MidweekEnabledButtons;
  }
}
