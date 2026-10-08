import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    launchOptions: {
      ...(process.env["TORVIK_CHROMIUM_PATH"]
        ? { executablePath: process.env["TORVIK_CHROMIUM_PATH"] }
        : {}),
      args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
    },
  },
  projects: [
    { name: "mobile-chromium", use: { ...devices["Pixel 7"], defaultBrowserType: "chromium" } },
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  ...(process.env["TORVIK_BUILD_VALIDATION"] === "1"
    ? {}
    : {
        webServer: {
          command: "bun run dev --host 127.0.0.1 --port 4173",
          url: "http://127.0.0.1:4173",
          reuseExistingServer: !process.env["CI"],
        },
      }),
});
