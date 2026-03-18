import { test, expect, Page } from "@playwright/test";

const COACH = {
  email: process.env.TEST_COACH_EMAIL ?? "coach@test.com",
  password: process.env.TEST_PASSWORD ?? "Test1234!",
};
const CLIENT = {
  email: process.env.TEST_CLIENT_EMAIL ?? "client@test.com",
  password: process.env.TEST_PASSWORD ?? "Test1234!",
};

async function login(page: Page, creds: { email: string; password: string }) {
  await page.goto("/");
  await page.waitForURL(/login/, { timeout: 20_000 });

  const inputs = page.locator("input");
  await inputs.first().fill(creds.email);
  await inputs.nth(1).fill(creds.password);
  await page.getByRole("button", { name: "Sign In" }).click();
}

function tab(page: Page, label: string) {
  return page.getByRole("tab", { name: new RegExp(label) }).first();
}

async function logout(page: Page) {
  await tab(page, "Settings").click();
  await expect(page.getByText("Sign Out")).toBeVisible({ timeout: 5_000 });

  page.once("dialog", (d) => d.accept());
  await page.getByText("Sign Out").click();

  await page.waitForTimeout(2000);
  await expect(page.getByText("NewCoach").first()).toBeVisible({ timeout: 15_000 });
}

// --------------- Coach flows ---------------

test.describe("Coach flows", () => {
  test("login → dashboard → tabs", async ({ page }) => {
    await login(page, COACH);

    await page.waitForURL(/coach|dashboard/, { timeout: 20_000 });
    await expect(page.getByText("Welcome back,")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Test Coach")).toBeVisible();
    await expect(page.getByText("Active Clients")).toBeVisible();
    await expect(page.getByText("Quick Actions")).toBeVisible();

    await tab(page, "Clients").click();
    await expect(
      page.getByPlaceholder("Search clients")
    ).toBeVisible({ timeout: 8_000 });

    await tab(page, "Library").click();
    await expect(page.getByText("Exercise Library")).toBeVisible({ timeout: 8_000 });

    await tab(page, "Messages").click();
    await page.waitForTimeout(1500);

    await tab(page, "Settings").click();
    await expect(page.getByText("Sign Out")).toBeVisible({ timeout: 5_000 });
  });

  test("exercise library shows seeded exercises", async ({ page }) => {
    await login(page, COACH);
    await page.waitForURL(/coach|dashboard/, { timeout: 20_000 });

    await tab(page, "Library").click();
    await page.waitForTimeout(2000);

    await expect(page.getByText("Barbell Back Squat").first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("Barbell Bench Press").first()).toBeVisible();
    await expect(page.getByText("Barbell Deadlift").first()).toBeVisible();
    await expect(page.getByText("60 exercises")).toBeVisible();
  });

  test("coach can sign out and re-login", async ({ page }) => {
    await login(page, COACH);
    await page.waitForURL(/coach|dashboard/, { timeout: 20_000 });
    await expect(page.getByText("Welcome back,")).toBeVisible({ timeout: 15_000 });

    await logout(page);
  });
});

// --------------- Client flows ---------------

test.describe("Client flows", () => {
  test("login → today screen → tabs", async ({ page }) => {
    await login(page, CLIENT);

    await page.waitForURL(/client|today/, { timeout: 20_000 });
    await expect(page.getByText("Hey, Test!")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Your Stats")).toBeVisible();

    await tab(page, "Calendar").click();
    await page.waitForTimeout(1500);

    await tab(page, "Messages").click();
    await page.waitForTimeout(1500);

    await tab(page, "Progress").click();
    await page.waitForTimeout(1500);

    await tab(page, "Settings").click();
    await expect(page.getByText("Sign Out")).toBeVisible({ timeout: 5_000 });
  });

  test("client can sign out and re-login", async ({ page }) => {
    await login(page, CLIENT);
    await page.waitForURL(/client|today/, { timeout: 20_000 });
    await expect(page.getByText("Hey, Test!")).toBeVisible({ timeout: 15_000 });

    await logout(page);
  });
});

// --------------- Auth edge cases ---------------

test.describe("Auth validation", () => {
  test("shows error on wrong password", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL(/login/, { timeout: 20_000 });

    const inputs = page.locator("input");
    await inputs.first().fill(process.env.TEST_COACH_EMAIL ?? "coach@test.com");
    await inputs.nth(1).fill("WrongPassword123!");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText(/invalid|credentials|error/i)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("navigate to sign up and back", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL(/login/, { timeout: 20_000 });

    await page.getByRole("button", { name: "Sign Up" }).click();
    await page.waitForTimeout(1000);
    await expect(page.getByText("Create Account").first()).toBeVisible({
      timeout: 8_000,
    });

    await page.goBack();
    await page.waitForTimeout(1000);
    await expect(page.locator("input").first()).toBeVisible({ timeout: 8_000 });
  });
});
