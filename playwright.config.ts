import { defineConfig } from "@playwright/test";
import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(__dirname, "e2e/.env") });

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://localhost:8081",
    headless: false,
    viewport: { width: 430, height: 932 },
    launchOptions: { slowMo: 300 },
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
