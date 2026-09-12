import { defineConfig } from "@playwright/test";
const publicUrl = process.env.TRAFFICDESK_URL;
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: publicUrl || "http://127.0.0.1:4176/trafficdesk/",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: publicUrl
    ? undefined
    : {
        command: "npm run preview",
        url: "http://127.0.0.1:4176/trafficdesk/",
        reuseExistingServer: !process.env.CI,
      },
  reporter: "list",
});
