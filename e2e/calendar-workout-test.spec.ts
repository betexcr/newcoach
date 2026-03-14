import { test } from "@playwright/test";

test("calendar workout card click test", async ({ page }) => {
  // 1. Go to localhost:8081
  await page.goto("http://localhost:8081");
  await page.waitForLoadState("networkidle");

  // 2. Screenshot
  await page.screenshot({ path: "e2e/screenshots/step1-home.png", fullPage: true });

  // 3. If login page, log in
  const signInBtn = page.getByRole("button", { name: /sign in/i });
  if (await signInBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    const inputs = page.locator("input");
    await inputs.first().fill("client@test.com");
    await inputs.nth(1).fill("Test1234!");
    await signInBtn.click();
    await page.waitForURL(/client|today|calendar/, { timeout: 15_000 });
  }

  // 4. Navigate to calendar
  await page.goto("http://localhost:8081/calendar");
  await page.waitForLoadState("networkidle");

  // 5. Screenshot of calendar
  await page.screenshot({ path: "e2e/screenshots/step2-calendar.png", fullPage: true });

  // 6. Click Tue or 10 to select Tuesday March 10
  const tueCell = page.getByText("Tue").first().locator("xpath=..");
  await tueCell.click();
  await page.waitForTimeout(2000);

  // 7. Screenshot after selecting Tue
  await page.screenshot({ path: "e2e/screenshots/step3-after-tue-select.png", fullPage: true });

  // 8. Click workout card if visible (e.g. "Active Recovery & Cardio")
  const workoutCard = page.locator('a[href*="/workout/"]').first();
  const cardCount = await workoutCard.count();
  let urlAfter = page.url();

  if (cardCount > 0) {
    await workoutCard.click();
    await page.waitForTimeout(2000);
    urlAfter = page.url();
  }

  // 9. Screenshot after click
  await page.screenshot({ path: "e2e/screenshots/step4-after-workout-click.png", fullPage: true });

  const hasExerciseDetails = await page.getByText(/exercise|sets|reps|Barbell|Squat/i).first().isVisible({ timeout: 2000 }).catch(() => false);
  const hasError = await page.getByText(/not found|error/i).first().isVisible({ timeout: 1000 }).catch(() => false);

  console.log("\n=== REPORT ===");
  console.log("URL after clicking workout card:", urlAfter);
  console.log("Workout detail page loaded with exercise details:", hasExerciseDetails);
  console.log("Errors visible:", hasError);
});
