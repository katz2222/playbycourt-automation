import { BrowserContext, Page, Locator } from "@playwright/test";
export class Navbar {
  // Locators
  protected page: Page;
  protected context: BrowserContext;
  private homePageButton: Locator;
  private navBar: Locator;
  private xButton: Locator;
  private commanderEntry: Locator;
  private reportAttendance: Locator;
  private reportsHistory: Locator;
  private settings: Locator;
  private logoutButton: Locator;

  // Constuctor
  constructor(page: Page, context: BrowserContext) {
    this.page = page;
    this.context = context;
    this.homePageButton = page.locator(".menuBtn");
    this.navBar = page.locator(".menuBtn");
    this.xButton = page.locator(".closeMenuBtn");
    this.commanderEntry = page.getByText("כניסת מפקד");
    this.reportAttendance = page.getByText("דיווח נוכחות");
    this.reportsHistory = page.getByText("היסטוריית דיווחים");
    this.settings = page.getByText("הגדרות");
    this.logoutButton = page.getByText("התנתקות");
  }

  // Getters
  getHomePageButton(): Locator {
    return this.homePageButton;
  }

  getCommanderEntry(): Locator {
    return this.commanderEntry;
  }

  getNavBar(): Locator {
    return this.navBar;
  }

  getXButton(): Locator {
    return this.xButton;
  }

  getReportAttendance(): Locator {
    return this.reportAttendance;
  }

  getReportsHistory(): Locator {
    return this.reportsHistory;
  }

  getSettings(): Locator {
    return this.settings;
  }

  getLogoutButton(): Locator {
    return this.logoutButton;
  }
}
