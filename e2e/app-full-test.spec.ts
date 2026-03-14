import { test } from "@playwright/test";

test("NewCoach app full test", async ({ page }) => {
  test.setTimeout(90000);

  // 1. Go to app, wait 3 sec, screenshot
  await page.goto("http://localhost:8081", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "e2e/screenshots/app-step1-initial.png", fullPage: true });

  // 2. If login page: clear storage, reload, log in
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
  await page.screenshot({ path: "e2e/screenshots/app-step2-after-login.png", fullPage: true });

  // 4. Click Calendar tab
  await page.getByRole("tab", { name: /calendar/i }).first().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "e2e/screenshots/app-step3-calendar.png", fullPage: true });

  const blueDotsCount = await page.locator('[style*="width: 6"], [style*="height: 6"], [style*="borderRadius: 3"]').count();
  const hasBlueDots = blueDotsCount > 0;

  // 5. Click Habits tab
  const habitsTab = page.getByRole("tab", { name: /habits/i });
  if (await habitsTab.count() > 0) {
    await habitsTab.first().click();
  } else {
    await page.getByText(/habits/i).first().click();
  }
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "e2e/screenshots/app-step4-habits.png", fullPage: true });

  // 6. Click Settings tab
  await page.getByRole("tab", { name: /settings/i }).first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "e2e/screenshots/app-step5-settings.png", fullPage: true });

  const menuItems = await page.locator('[role="button"], a, [class*="menu"], [class*="item"]').allTextContents();
  const settingsText = await page.textContent("body").catch(() => "");

  console.log("\n=== REPORT ===");
  console.log("Blue dots visible on calendar days:", hasBlueDots, `(${blueDotsCount} dot elements)`);
  console.log("Settings page content (menu items):", settingsText?.substring(0, 500) || "N/A");
});
