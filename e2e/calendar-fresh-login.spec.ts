import { test } from "@playwright/test";

test("calendar fresh login - clear storage and verify", async ({ page }) => {
  test.setTimeout(90000);
  // 1. Go to localhost:8081
  await page.goto("http://localhost:8081", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  // 2. Screenshot
  await page.screenshot({ path: "e2e/screenshots/fresh-step1-initial.png", fullPage: true });

  // 3. Clear storage and reload
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  // 4. Screenshot - should see login
  await page.screenshot({ path: "e2e/screenshots/fresh-step2-after-clear.png", fullPage: true });

  // 5-7. Login
  const inputs = page.locator("input");
  await inputs.first().fill("client@test.com");
  await inputs.nth(1).fill("Test1234!");
  await page.getByRole("button", { name: /sign in/i }).click();

  // 8. Wait 3 sec, screenshot
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "e2e/screenshots/fresh-step3-after-login.png", fullPage: true });

  // 9. Click Calendar tab
  await page.getByRole("tab", { name: /calendar/i }).first().click();

  // 10. Wait 2 sec, screenshot
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "e2e/screenshots/fresh-step4-calendar.png", fullPage: true });

  // 11. Check for blue dots (small dots under day numbers)
  const hasBlueDots = (await page.locator('[style*="width: 6"][style*="height: 6"], [style*="borderRadius: 3"]').count()) > 0;

  // 12. Click Tue or 10
  await page.getByText("Tue").first().locator("xpath=..").click();

  // 13. Wait 2 sec, screenshot
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "e2e/screenshots/fresh-step5-after-tue-select.png", fullPage: true });

  // Check workout card
  const workoutCard = page.locator('a[href*="/workout/"]').first();
  const cardVisible = (await workoutCard.count()) > 0;
  let cardText = "";
  if (cardVisible) {
    cardText = await workoutCard.textContent().catch(() => "");
  }

  const hasError = await page.getByText(/error|not found/i).first().isVisible({ timeout: 1000 }).catch(() => false);

  console.log("\n=== REPORT ===");
  console.log("Workouts on calendar (blue dots under days):", hasBlueDots ? "yes" : "check screenshot");
  console.log("Workout card appeared when selecting day:", cardVisible);
  console.log("Workout card shows:", cardText || "N/A");
  console.log("Errors visible:", hasError);
});
