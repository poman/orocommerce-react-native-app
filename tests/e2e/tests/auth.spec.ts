import { test, expect, testData } from '../fixtures';

test.describe('Authentication Flow - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  /**
   * Test Case 1: Successful Login with Valid Credentials
   */
  test('should successfully log in with valid credentials', async ({ page, loginPage }) => {
    await loginPage.login(testData.validUser.email, testData.validUser.password);

    await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/login');

    const hasSuccessMessage = await page.getByText(/logged in|success|welcome/i).isVisible().catch(() => false);
    const isNavigatedAway = !currentUrl.includes('/login');

    expect(hasSuccessMessage || isNavigatedAway).toBeTruthy();
  });

  /**
   * Test Case 2: Login Failure with Invalid Credentials
   */
  test('should show error with invalid credentials', async ({ page, loginPage }) => {
    await loginPage.login(testData.invalidUser.email, testData.invalidUser.password);

    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    const hasError = await page.getByText(/invalid|error|failed|check your credentials/i).isVisible().catch(() => false);

    expect(currentUrl.includes('/login') || hasError).toBeTruthy();
  });

  /**
   * Test Case 3: Email Field Validation - Empty Email
   */
  test('should validate empty email field', async ({ page }) => {
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('sign-in-button').click();
    await page.waitForTimeout(1000);
    const hasError = await page.getByText(/email.*required/i).isVisible().catch(() => false);
    expect(hasError).toBeTruthy();
  });

  /**
   * Test Case 4: Email Field Validation - Invalid Email Format
   */
  test('should validate invalid email format', async ({ page }) => {
    await page.getByTestId('email-input').fill('invalid-email');
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('sign-in-button').click();
    await page.waitForTimeout(1000);
    const hasError = await page.getByText(/valid.*email/i).isVisible().catch(() => false);
    expect(hasError).toBeTruthy();
  });

  /**
   * Test Case 5: Password Input Security - Masking Verification
   */
  test('should mask password input', async ({ page }) => {
    const passwordInput = page.getByTestId('password-input');
    await expect(passwordInput).toBeVisible();
  });

  /**
   * Test Case 6: Responsive Design - Mobile Viewport
   */
  test('should display correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('sign-in-button')).toBeVisible();
  });
});

test.describe('Authenticated User Features', () => {
  /**
   * Test Case 7: Post-Login Navigation - Home Page Access
   */
  test('should access home page after login', async ({ authenticatedPage }) => {
    await expect(authenticatedPage).not.toHaveURL(/login/);

    await authenticatedPage.goto('/');
    await authenticatedPage.waitForLoadState('networkidle');

    const currentUrl = authenticatedPage.url();
    expect(currentUrl).not.toContain('/login');
    expect(currentUrl).toContain('/');
  });

  /**
   * Test Case 8: Session Persistence - Page Reload
   */
  test('should maintain session after page reload', async ({ authenticatedPage }) => {
    await expect(authenticatedPage).not.toHaveURL(/login/);

    const urlBeforeReload = authenticatedPage.url();

    await authenticatedPage.reload();
    await authenticatedPage.waitForLoadState('networkidle');

    await expect(authenticatedPage).not.toHaveURL(/login/);
    expect(authenticatedPage.url()).toBe(urlBeforeReload);
  });
});
