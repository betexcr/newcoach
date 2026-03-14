import { test } from "@playwright/test";

test("NewCoach app features: Calendar, Habits, Settings", async ({ page }) => {
  test.setTimeout(120000);

  // 1. Go to app
  await page.goto("http://localhost:8081", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  // 2. If login page, clear storage and log in
  const signInBtn = page.getByRole("button", { name: /sign in/i });
  if (await signInBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    const inputs = page.locator("input");
    await inputs.first().fill("client@test.com");
    await inputs.nth(1).fill("Test1234!");
    await signInBtn.click();
    await page.waitForTimeout(3000);
  }

  // 3. Screenshot after login
  await page.screenshot({ path: "e2e/screenshots/features-step1-after-login.png", fullPage: true });

  // 4. Test Calendar
  await page.getByRole("tab", { name: /calendar/i }).first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "e2e/screenshots/features-step2-calendar.png", fullPage: true });

  const hasBlueDots = (await page.locator('[style*="width: 6"], [style*="height: 6"]').count()) > 0;
  const tueCell = page.getByText("Tue").first().locator("xpath=..");
  if (await tueCell.count() > 0) {
    await tueCell.click();
    await page.waitForTimeout(1500);
  }
  await page.screenshot({ path: "e2e/screenshots/features-step3-calendar-after-day-select.png", fullPage: true });

  const workoutCard = page.locator('a[href*="/workout/"]').first();
  const cardCount = await workoutCard.count();
  let calendarNavigatesToDetail = false;
  let urlBefore = page.url();
  if (cardCount > 0) {
    await workoutCard.click();
    await page.waitForTimeout(2000);
    const urlAfter = page.url();
    calendarNavigatesToDetail = urlAfter.includes("/workout/") && !urlAfter.includes("undefined");
  }

  // 5. Test Habits
  await page.goto("http://localhost:8081");
  await page.waitForTimeout(1000);
  const habitsTab = page.getByRole("tab", { name: /habits/i });
  const habitsVisible = await habitsTab.count() > 0;
  if (habitsVisible) {
    await habitsTab.first().click();
    await page.waitForTimeout(1500);
  }
  await page.screenshot({ path: "e2e/screenshots/features-step4-habits.png", fullPage: true });

  // 6. Test Settings
  await page.getByRole("tab", { name: /settings/i }).first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "e2e/screenshots/features-step5-settings.png", fullPage: true });

  const editProfile = await page.getByText(/edit profile/i).first().isVisible({ timeout: 2000 }).catch(() => false);
  const progressStats = await page.getByText(/progress.*stats|stats.*progress/i).first().isVisible({ timeout: 2000 }).catch(() => false);
  const milestones = await page.getByText(/milestones/i).first().isVisible({ timeout: 2000 }).catch(() => false);
  const nutritionTracker = await page.getByText(/nutrition tracker|nutrition/i).first().isVisible({ timeout: 2000 }).catch(() => false);

  console.log("\n=== REPORT ===");
  console.log("Calendar shows workouts (blue dots):", hasBlueDots);
  console.log("Clicking workout card navigates to detail:", calendarNavigatesToDetail);
  console.log("Habits tab visible and functional:", habitsVisible);
  console.log("Settings - Edit Profile:", editProfile);
  console.log("Settings - Progress & Stats:", progressStats);
  console.log("Settings - Milestones:", milestones);
  console.log("Settings - Nutrition Tracker:", nutritionTracker);
});
