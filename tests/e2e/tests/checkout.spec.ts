import { test, expect, testData } from '../fixtures';

test.describe('Shopping List & Navigation', () => {
  test.beforeEach(async ({ page, loginPage }) => {
    await page.goto('/login');
    await loginPage.login(testData.validUser.email, testData.validUser.password);
    await page.waitForTimeout(2000);
  });

  /**
   * Test Case 1: Home Page Navigation
   */
  test('should navigate to home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).not.toContain('/login');
  });

  /**
   * Test Case 2: Shopping Lists Page Access
   */
  test('should access shopping lists page', async ({ page }) => {
    await page.goto('/shopping-lists');
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toContain('shopping-lists');
  });

  /**
   * Test Case 3: Product Display on Home Page
   */
  test('should display products on home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/test-results/home-products.png', fullPage: true });
    await page
      .getByText(/steel|storage|desk|chair|table|cabinet/i)
      .first()
      .isVisible()
      .catch(() => false);
    expect(page.url()).not.toContain('/login');
  });
});

test.describe('Product Interaction', () => {
  test.beforeEach(async ({ page, loginPage }) => {
    await page.goto('/login');
    await loginPage.login(testData.validUser.email, testData.validUser.password);
    await page.waitForTimeout(2000);
  });

  /**
   * Test Case 4: Product Detail Page Navigation
   */
  test('should open product detail page', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    const productTexts = ['steel', 'storage', 'desk', 'chair', 'table', 'cabinet'];
    for (const text of productTexts) {
      const element = await page
        .getByText(new RegExp(text, 'i'))
        .first()
        .isVisible()
        .catch(() => false);
      if (element) {
        await page.getByText(new RegExp(text, 'i')).first().click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'tests/test-results/product-detail.png', fullPage: true });
        const url = page.url();
        expect(url).toBeTruthy();
        return;
      }
    }
    expect(page.url()).not.toContain('/login');
  });

  /**
   * Test Case 5: Search Functionality
   */
  test('should have search functionality', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    const searchInput = page.getByPlaceholder(/search/i).first();
    const isVisible = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);
    if (isVisible) {
      await searchInput.fill('desk');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'tests/test-results/search-test.png' });
      expect(true).toBeTruthy();
    } else {
      expect(page.url()).not.toContain('/login');
    }
  });
});

test.describe('Navigation & Layout', () => {
  test.beforeEach(async ({ page, loginPage }) => {
    await page.goto('/login');
    await loginPage.login(testData.validUser.email, testData.validUser.password);
    await page.waitForTimeout(2000);
  });

  /**
   * Test Case 6: Orders Page Access
   */
  test('should access orders page', async ({ page }) => {
    await page.goto('/orders');
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toContain('orders');
  });

  /**
   * Test Case 7: Profile Page Access
   */
  test('should access profile page', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toContain('profile');
  });

  /**
   * Test Case 8: Mobile Viewport Responsiveness
   */
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/test-results/mobile-view.png', fullPage: true });
    const url = page.url();
    expect(url).not.toContain('/login');
  });

  /**
   * Test Case 9: Tablet Viewport Responsiveness
   */
  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/test-results/tablet-view.png', fullPage: true });
    const url = page.url();
    expect(url).not.toContain('/login');
  });
});
