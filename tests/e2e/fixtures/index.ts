import { test as base, expect, Page } from '@playwright/test';

export const testData = {
  validUser: {
    email: 'AmandaRCole@example.org',
    password: 'AmandaRCole@example.org',
  },
  invalidUser: {
    email: 'invalid@example.com',
    password: 'wrongpassword',
  },
};

export class BasePage {
  constructor(public page: Page) {}

  async goto(path: string = '/') {
    await this.page.goto(path);
  }

  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }
}

export class LoginPage extends BasePage {
  async login(email: string, password: string) {
    await this.page.getByTestId('email-input').fill(email);
    await this.page.getByTestId('password-input').fill(password);
    await this.page.getByTestId('sign-in-button').click();
  }
}

export class HomePage extends BasePage {}

export const test = base.extend<{
  loginPage: LoginPage;
  homePage: HomePage;
  authenticatedPage: Page;
}>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto('/login');
    await loginPage.login(testData.validUser.email, testData.validUser.password);
    await page.waitForTimeout(10000);
    await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 10000 });
    await use(page);
  },
});

export { expect };
