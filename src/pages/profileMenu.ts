import { BrowserContext, Page, Locator } from "@playwright/test";
export class profileMenu {
  // Locators
  protected page: Page;
  protected context: BrowserContext;
  private profileButton: Locator;
  private myBookingsButton: Locator;
  private logoutButton: Locator;

  // Constuctor
  constructor(page: Page, context: BrowserContext) {
    this.page = page;
    this.context = context;
    this.profileButton = this.page.getByText("Profile");
    this.myBookingsButton = this.page.getByText("My Bookings");
    this.logoutButton = this.page.getByText("Logout");
  }

  // Getters
  getProfileButton(): Locator {
    return this.profileButton;
  }

  geMyBookingsButton(): Locator {
    return this.myBookingsButton;
  }

  getLogoutButton(): Locator {
    return this.logoutButton;
  }

  // Methods
  async openProfile(): Promise<void> {
    await this.getProfileButton().click();
  }

  async openMyBookings(): Promise<void> {
    await this.geMyBookingsButton().click();
  }

  async logout(): Promise<void> {
    await this.getLogoutButton().click();
  }
}
