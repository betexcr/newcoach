import { test } from "@playwright/test";

test("calendar workout card - full flow after cache clear", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    const type = msg.type();
    if (type === "error") {
      consoleErrors.push(msg.text());
    }
  });

  // 1. Go to localhost:8081
  await page.goto("http://localhost:8081");
  await page.waitForTimeout(3000);

  // 2. Screenshot
  await page.screenshot({ path: "e2e/screenshots/full-step1-home.png", fullPage: true });

  // 3. If login page, log in
  const signInBtn = page.getByRole("button", { name: /sign in/i });
  if (await signInBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    const inputs = page.locator("input");
    await inputs.first().fill("client@test.com");
    await inputs.nth(1).fill("Test1234!");
    await signInBtn.click();
    await page.waitForTimeout(3000);
  }

  // 4. Screenshot after login
  await page.screenshot({ path: "e2e/screenshots/full-step2-after-login.png", fullPage: true });

  // 5. Navigate to calendar
  await page.goto("http://localhost:8081/calendar");
  await page.waitForLoadState("networkidle");

  // 6. Screenshot of calendar
  await page.screenshot({ path: "e2e/screenshots/full-step3-calendar.png", fullPage: true });

  // 7. Click Tue or 10 to select Tuesday March 10
  const tueCell = page.getByText("Tue").first().locator("xpath=..");
  await tueCell.click();
  await page.waitForTimeout(2000);

  // 8. Screenshot after selecting Tue
  await page.screenshot({ path: "e2e/screenshots/full-step4-after-tue.png", fullPage: true });

  const urlBefore = page.url();

  // 9. Click workout card (e.g. "Active Recovery & Cardio" or "Upper Body Hypertrophy")
  const cardLink = page.locator('a[href*="/workout/"]').first();
  const cardCount = await cardLink.count();
  if (cardCount > 0) {
    await cardLink.click();
  } else {
    await page.getByText(/Active Recovery|Upper Body|Cardio|Hypertrophy/i).first().click();
  }
  await page.waitForTimeout(3000);

  // 10. Screenshot after click
  await page.screenshot({ path: "e2e/screenshots/full-step5-after-workout-click.png", fullPage: true });

  const urlAfter = page.url();
  const urlContainsUndefined = urlAfter.includes("undefined");
  const hasWorkoutDetail = await page.getByText(/exercise|sets|reps|Barbell|Squat|Bench|Deadlift/i).first().isVisible({ timeout: 2000 }).catch(() => false);
  const hasNotFoundError = await page.getByText(/not found/i).first().isVisible({ timeout: 1000 }).catch(() => false);

  console.log("\n=== REPORT ===");
  console.log("URL before clicking workout card:", urlBefore);
  console.log("URL after clicking workout card:", urlAfter);
  console.log("URL contains 'undefined':", urlContainsUndefined);
  console.log("Workout detail page loaded:", !hasNotFoundError && hasWorkoutDetail);
  console.log("Card shows correct exercises:", hasWorkoutDetail);
  console.log("Page errors (not found):", hasNotFoundError);
  console.log("Console errors:", consoleErrors.length > 0 ? consoleErrors : "none");
});
