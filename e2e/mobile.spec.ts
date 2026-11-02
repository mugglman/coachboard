import { expect, test } from "@playwright/test";

test("Übung auf dem Smartphone abspielen", async ({ page }) => {
  await page.goto("/");
  const href = await page.getByTestId("exercise-grid").locator("a").first().getAttribute("href");
  const id = href?.split("id=")[1];
  await page.goto(`/play?id=${id}`);
  await expect(page.getByTestId("player-board").locator("canvas").first()).toBeVisible();
  await page.getByTestId("player-play").click();
  await page.waitForTimeout(600);
  await expect(page.getByLabel("Zeitleiste")).not.toHaveValue("0");
});
