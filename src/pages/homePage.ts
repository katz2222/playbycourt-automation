import { BrowserContext, Page, Locator } from "@playwright/test";
import { Navbar } from "./navbar";
export class HomePage extends Navbar {
  // Locators
  protected page: Page;
  protected context: BrowserContext;
  private myReservationsDates: Locator;
  private myReservationsHours: Locator;
  private myReservationDetailsButton: Locator;
  private facilities: Locator;
  private calendarButton: Locator;
  private orderCourtButton: Locator;

  // Constuctor
  constructor(page: Page, context: BrowserContext) {
    super(page, context);
    this.page = page;
    this.context = context;
    this.myReservationsDates = this.page.locator(".text.black.semi.bold");
    this.myReservationsHours = this.page.locator(".meta");
    this.myReservationDetailsButton = this.page.getByText("View Details");
    this.facilities = this.page.locator(".flex_shrink_0.pbc_carousel_item");
    this.calendarButton = this.page.locator(".home_calendar_view");
    this.orderCourtButton = this.page.getByText(" להזמנת מגרש -> ");
  }

  // Getters
  getMyReservationsDates(): Locator {
    return this.myReservationsDates;
  }

  getMyReservationsHours(): Locator {
    return this.myReservationsHours;
  }

  getMyReservationsDetailsButton(): Locator {
    return this.myReservationDetailsButton;
  }

  getFacilities(): Locator {
    return this.facilities;
  }

  getCalendarButton(): Locator {
    return this.calendarButton;
  }

  getOrderCourtButton(): Locator {
    return this.orderCourtButton;
  }

  // Methods
  async chooseFacility(facilityName: string): Promise<void> {
    await this.getFacilities().getByText(facilityName).click();
  }

  async openCalendar(): Promise<void> {
    await this.getCalendarButton().click();
  }

  async openOrderCourtPage(): Promise<void> {
    await this.getOrderCourtButton().click();
  }
}
