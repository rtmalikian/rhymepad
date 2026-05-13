import { expect, test } from "@playwright/test";
import path from "node:path";

test("captures README screenshots", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByText(/Saved to SQLite|Saved in browser/)).toBeVisible();
  await page.getByRole("button", { name: /Analyze/i }).click();
  await page.getByRole("button", { name: /time/i }).first().click();
  await expect(page.getByRole("dialog", { name: /Rhyming dictionary for time/i })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Dictionary" })).toContainText("time");

  const outputName = testInfo.project.name === "mobile" ? "rhymepad-mobile.png" : "rhymepad-desktop.png";
  await page.screenshot({
    path: path.join(process.cwd(), "docs", "screenshots", outputName),
    fullPage: true
  });
});
