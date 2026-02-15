import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',

  outputDir: './tests/test-results',

  timeout: 60 * 1000,

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html', { outputFolder: 'tests/playwright-report' }],
    ['list'],
    ['json', { outputFile: 'tests/test-results/test-results.json' }],
  ],

  use: {
    baseURL: 'http://localhost:8081',

    screenshot: 'only-on-failure',

    video: 'retain-on-failure',

    trace: 'on-first-retry',

    actionTimeout: 15000,

    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 393, height: 851 },
      },
    },

    {
      name: 'tablet',
      use: {
        ...devices['iPad Pro'],
        viewport: { width: 1024, height: 1366 },
      },
    },
  ],

  webServer: {
    command: 'npm run web',
    url: 'http://localhost:8081',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
