import { defineConfig, devices } from '@playwright/test';

const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@example.com';
const adminPassword = process.env.ADMIN_PASSWORD ?? 'replace-with-a-strong-password';
const appSecret = process.env.APP_SECRET ?? 'replace-this-with-a-random-secret-at-least-32-characters-long';
const skipWebServer = !!process.env.PLAYWRIGHT_SKIP_WEB_SERVER;

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      use: {
        ...devices['Pixel 7'],
        browserName: 'chromium',
      },
    },
  ],
  webServer: skipWebServer
    ? undefined
    : {
        command: 'npm run dev -- --hostname 127.0.0.1 --port 3000',
        cwd: '.',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
        env: {
          ADMIN_EMAIL: adminEmail,
          ADMIN_PASSWORD: adminPassword,
          APP_SECRET: appSecret,
          NODE_ENV: 'test',
        },
      },
});
