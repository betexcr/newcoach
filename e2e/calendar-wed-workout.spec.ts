import { test } from "@playwright/test";

const CLIENT = { email: "client@test.com", password: "password123" };

test("calendar: Wed 11 → workout card → detail page", async ({ page }) => {
  await page.goto("/calendar");
  await page.waitForLoadState("networkidle");

  if (await page.locator('input[type="email"], input[type="text"]').first().isVisible({ timeout: 3000 }).catch(() => false)) {
    const inputs = page.locator("input");
    await inputs.first().fill(CLIENT.email);
    await inputs.nth(1).fill(CLIENT.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/calendar|client|today/, { timeout: 15_000 });
  }

  await page.getByRole("tab", { name: /calendar/i }).first().click().catch(() => {});
  await page.waitForURL(/calendar/, { timeout: 10_000 });
  await page.waitForTimeout(2000);

  // 1. Screenshot - current state
  await page.screenshot({ path: "e2e/screenshots/calendar-step1-initial.png", fullPage: true });

  // 2. Click Wed 11 (Wednesday March 11)
  const wedCell = page.getByText("Wed").first().locator("xpath=..");
  await wedCell.click();
  await page.waitForTimeout(2000);

  // 3. Screenshot after selecting Wed
  await page.screenshot({ path: "e2e/screenshots/calendar-step2-after-wed-select.png", fullPage: true });

  const urlBefore = page.url();

  // 4. Click workout card (e.g. "Upper Body Hypertrophy")
  const workoutCard = page.locator('a[href*="/workout/"]').first();
  const cardCount = await workoutCard.count();
  if (cardCount > 0) {
    await workoutCard.click();
  } else {
    await page.getByText(/Upper Body|workout/i).first().click();
  }
  await page.waitForTimeout(2000);

  // 5. Screenshot after click
  await page.screenshot({ path: "e2e/screenshots/calendar-step3-after-workout-click.png", fullPage: true });

  const urlAfter = page.url();
  const hasExercises = await page.getByText(/exercise|sets|reps/i).first().isVisible({ timeout: 2000 }).catch(() => false);
  const hasError = await page.getByText(/not found|error/i).first().isVisible({ timeout: 1000 }).catch(() => false);

  console.log("\n=== REPORT ===");
  console.log("URL before click:", urlBefore);
  console.log("URL after click:", urlAfter);
  console.log("Workout detail with exercises:", hasExercises);
  console.log("Error visible:", hasError);
});
