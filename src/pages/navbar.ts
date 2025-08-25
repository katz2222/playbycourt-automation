import { BrowserContext, Page, Locator } from "@playwright/test";
export class Navbar {
  // Locators
  protected page: Page;
  protected context: BrowserContext;
  private homePageButton: Locator;
  private appIconButton: Locator;
  private notificationsMenuButton: Locator;
  private profileMenuButton: Locator;

  // Constuctor
  constructor(page: Page, context: BrowserContext) {
    this.page = page;
    this.context = context;
    this.homePageButton = this.page.locator(".item.mobile .icon-house-door");
    this.appIconButton = this.page.locator(".header_logo_size");
    this.notificationsMenuButton = this.page.locator(".NotificationMenu");
    this.profileMenuButton = this.page.locator("#profile_menu_settings");
  }

  // Getters
  getHomePageButton(): Locator {
    return this.homePageButton;
  }

  getAppIcon(): Locator {
    return this.appIconButton;
  }

  getNotificationsMenuButton(): Locator {
    return this.notificationsMenuButton;
  }

  geProfileMenuButton(): Locator {
    return this.profileMenuButton;
  }

  // Methods
  async goToHomePage() {
    await this.getHomePageButton().click();
  }

  async clickOnAppIcon() {
    await this.getAppIcon().click();
  }

  async openNotificationsMenu() {
    await this.getNotificationsMenuButton().click();
  }

  async openProfileMenu() {
    await this.geProfileMenuButton().click();
  }
}
