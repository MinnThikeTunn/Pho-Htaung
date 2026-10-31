import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: /cross-browser\.spec\.ts$/,
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    viewport: { width: 1440, height: 1000 },
    trace: 'off',
    screenshot: 'off',
    video: 'off'
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30000
  },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/cross-browser-playwright-report', open: 'never' }],
    ['json', { outputFile: 'reports/cross-browser/results.json' }]
  ],
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 1000 }
      }
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1440, height: 1000 }
      }
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1440, height: 1000 }
      }
    },
    {
      name: 'msedge',
      use: {
        channel: 'msedge',
        viewport: { width: 1440, height: 1000 }
      }
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5 landscape']
      }
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 13 landscape']
      }
    }
  ]
});
