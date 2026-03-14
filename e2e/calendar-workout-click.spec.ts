import { test, expect } from "@playwright/test";

const CLIENT = { email: "client@test.com", password: "Test1234!" };

test("calendar page → click workout card → verify navigation", async ({
  page,
}) => {
  // 1. Login as client (calendar is a client view)
  await page.goto("/");
  await page.waitForURL(/login/, { timeout: 20_000 });
  const inputs = page.locator("input");
  await inputs.first().fill(CLIENT.email);
  await inputs.nth(1).fill(CLIENT.password);
  await page.getByRole("button", { name: "Sign In" }).click();

  await page.waitForURL(/client|today/, { timeout: 20_000 });

  // 2. Go to Calendar tab
  await page.getByRole("tab", { name: /calendar/i }).first().click();
  await page.waitForURL(/calendar/, { timeout: 10_000 });

  // 3. Wait for page to fully load
  await page.waitForTimeout(3000);

  // 4. Take first screenshot
  await page.screenshot({
    path: "e2e/screenshots/calendar-before-click.png",
    fullPage: true,
  });

  // 5. Look for a workout card (WorkoutCard shows workout.name, e.g. "Active Recovery & Cardio")
  const workoutCard = page.locator('a[href*="/workout/"]').first();
  const cardCount = await workoutCard.count();
  const cardCount = await workoutCard.count();

  if (cardCount === 0) {
    // No workout cards - take screenshot and report
    await page.screenshot({
      path: "e2e/screenshots/calendar-no-workouts.png",
      fullPage: true,
    });
    throw new Error("No workout cards found on calendar page");
  }

  const urlBefore = page.url();
  const workoutHref = await workoutCard.getAttribute("href");

  // 6. Click the workout card
  await workoutCard.click();

  // 7. Wait for navigation
  await page.waitForTimeout(2000);

  // 8. Take second screenshot
  await page.screenshot({
    path: "e2e/screenshots/calendar-after-click.png",
    fullPage: true,
  });

  const urlAfter = page.url();

  // Log results for report
  console.log("\n=== CALENDAR WORKOUT CLICK REPORT ===");
  console.log("URL before click:", urlBefore);
  console.log("URL after click:", urlAfter);
  console.log("Workout link href:", workoutHref);
  console.log("Navigated to workout page:", urlAfter.includes("/workout/"));
});
