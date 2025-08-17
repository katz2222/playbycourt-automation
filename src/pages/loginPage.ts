import { Page, BrowserContext, Locator } from "@playwright/test";
import { TZ } from "env-variables";

export class LoginPage {
  // Locators
  private tzInput: Locator;
  private loginButton: Locator;

  // Constructor
  constructor(page: Page, context: BrowserContext) {
    this.tzInput = page.locator("input");
    this.loginButton = page.locator(".btnGeneral");
  }

  // Getters
  getTzInput(): Locator {
    return this.tzInput;
  }
  getLoginButton(): Locator {
    return this.loginButton;
  }

  // Methods
  async login(): Promise<void> {
    await this.getTzInput().fill(TZ);
    await this.getLoginButton().click();
  }
}
