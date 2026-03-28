import { test } from "@playwright/test";

const CLIENT = {
  email: process.env.TEST_CLIENT_EMAIL ?? "client@test.com",
  password: process.env.TEST_PASSWORD ?? "Test1234!",
};

test("calendar: select Tue 10 → workout card → click → detail page", async ({
  page,
}) => {
  // 1. Go to calendar (may redirect to login)
  await page.goto("/calendar");
  await page.waitForLoadState("networkidle");

  // 2. If login screen, log in
  const loginInput = page.locator('input[type="email"], input[type="text"]').first();
  if (await loginInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    const inputs = page.locator("input");
    await inputs.first().fill(CLIENT.email);
    await inputs.nth(1).fill(CLIENT.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/calendar|client|today/, { timeout: 15_000 });
  }

  // 3. Ensure we're on calendar
  await page.getByRole("tab", { name: /calendar/i }).first().click().catch(() => {});
  await page.waitForURL(/calendar/, { timeout: 10_000 });
  await page.waitForTimeout(2000);

  // 4. Take initial screenshot
  await page.screenshot({
    path: "e2e/screenshots/calendar-initial.png",
    fullPage: true,
  });

  // 5. Click "Tue 10" - the day cell contains both "Tue" and "10"
  const tueCell = page.getByText("Tue").first().locator("xpath=..");
  await tueCell.click();
  await page.waitForTimeout(1500);

  // 6. Screenshot after selecting Tue 10
  await page.screenshot({
    path: "e2e/screenshots/calendar-after-tue-select.png",
    fullPage: true,
  });

  // 7. Check if workout card appeared
  const workoutCard = page.locator('a[href*="/workout/"]').first();
  const cardCount = await workoutCard.count();
  const workoutCardAppeared = cardCount > 0;

  if (!workoutCardAppeared) {
    console.log("\n=== REPORT: No workout card found after selecting Tue 10 ===");
    return;
  }

  const urlBefore = page.url();

  // 8. Click the workout card
  await workoutCard.click();
  await page.waitForTimeout(2000);

  // 9. Screenshot after click
  await page.screenshot({
    path: "e2e/screenshots/calendar-after-workout-click.png",
    fullPage: true,
  });

  const urlAfter = page.url();
  const navigatedToDetail = urlAfter.includes("/workout/") && !urlAfter.includes("undefined");

  console.log("\n=== CALENDAR WORKOUT REPORT ===");
  console.log("Workout card appeared after Tue 10:", workoutCardAppeared);
  console.log("Navigated to workout detail:", navigatedToDetail);
  console.log("URL before click:", urlBefore);
  console.log("URL after click:", urlAfter);
});
