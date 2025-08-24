import { BrowserContext, Page, Locator } from "@playwright/test";
import { Navbar } from "./navbar";
import { parseSlotStartTimeToHour } from "@src/utilities/date.utils";
export class OrderCourtPage extends Navbar {
  // Locators
  protected page: Page;
  protected context: BrowserContext;
  private dates: Locator;
  private daysInWeek: Locator;
  private daysNumber: Locator;
  private calendarButton: Locator;
  private hoursSlots: Locator;
  private availableCourts: Locator;
  private nextButton: Locator;
  private readonly unavilableSlotClass: string = "red";

  // Constuctor
  constructor(page: Page, context: BrowserContext) {
    super(page, context);
    this.page = page;
    this.context = context;
    this.dates = this.page.locator(".day-container button");
    this.daysInWeek = this.dates.locator(".day_name");
    this.daysNumber = this.dates.locator(".day_number");
    this.calendarButton = this.page.getByText("View calendar");
    this.hoursSlots = this.page.locator(".ButtonOption:not(.mr5)");
    this.availableCourts = this.page.getByText("Court", { exact: false });
    this.nextButton = this.page.getByText("Next");
  }

  // Getters
  public getDates(): Locator {
    return this.dates;
  }

  public getDaysInWeek(): Locator {
    return this.daysInWeek;
  }

  public getDaysNumber(): Locator {
    return this.daysNumber;
  }

  public getCalendarButton(): Locator {
    return this.calendarButton;
  }

  public getHoursSlots(): Locator {
    return this.hoursSlots;
  }

  public getAvailableCourts(): Locator {
    return this.availableCourts;
  }

  public getNextButton(): Locator {
    return this.nextButton;
  }

  // Methods
  async isSlotFree(slot: Locator): Promise<boolean | undefined> {
    const classAttr = await slot.getAttribute("class");
    return !classAttr?.includes(this.unavilableSlotClass);
  }

  async getSlotStartHour(slot: Locator): Promise<number | null> {
    const slotHour = await slot.textContent();
    if (slotHour !== null) {
      return parseSlotStartTimeToHour(slotHour);
    }
    return null;
  }

  async findStartSlotIndex(serachStartHour: number) {
    for (let i = 0; i < (await this.hoursSlots.count()); i++) {
      const slotStartHour: number | null = await this.getSlotStartHour(
        this.hoursSlots.nth(i)
      );

      if (serachStartHour === slotStartHour) {
        return i;
      }
    }
  }

  async findLastSlotIndex(serachLastHour: number) {
    for (let i = 0; i < (await this.hoursSlots.count()); i++) {
      const slotStartHour: number | null = await this.getSlotStartHour(
        this.hoursSlots.nth(i)
      );

      if (serachLastHour === slotStartHour) {
        return i - 1;
      }
    }
  }
}
