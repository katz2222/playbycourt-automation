import { BrowserContext, Page, Locator } from "@playwright/test";
import { PASSWORD, EMAIL } from "env-variables";

export class LoginPage {
  // Locators
  protected page: Page;
  protected context: BrowserContext;
  private emailInput: Locator;
  private passwordInput: Locator;
  private loginButton: Locator;

  // Constructor
  constructor(page: Page, context: BrowserContext) {
    this.page = page;
    this.context = context;
    this.emailInput = this.page.locator("#user_email");
    this.passwordInput = this.page.locator("#user_password");
    this.loginButton = this.page.locator("[value='Log in']");
  }

  // Getters
  getEmailInput(): Locator {
    return this.emailInput;
  }

  getPasswordInput(): Locator {
    return this.passwordInput;
  }
  getLoginButton(): Locator {
    return this.loginButton;
  }

  // Methods
  async login(): Promise<void> {
    await this.getEmailInput().fill(EMAIL);
    await this.getPasswordInput().fill(PASSWORD);
    await this.getLoginButton().click();
  }
}
