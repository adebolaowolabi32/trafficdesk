import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4176/trafficdesk/",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run preview",
    url: "http://127.0.0.1:4176/trafficdesk/",
    reuseExistingServer: !process.env.CI,
  },
  reporter: "list",
});
