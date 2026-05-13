import { expect, test } from "@playwright/test";
import path from "node:path";

test("captures README screenshots", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByText(/Saved to SQLite|Saved in browser/)).toBeVisible();
  await page.getByRole("button", { name: /Analyze/i }).click();
  await page.getByLabel("Rhyme writing notepad").evaluate((element) => {
    const textarea = element as HTMLTextAreaElement;
    textarea.focus();
    textarea.setSelectionRange(11, 11);
  });
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("dialog", { name: /Rhyming dictionary for time/i })).toBeVisible();
  if (testInfo.project.name === "mobile") {
    await expect(page.getByRole("complementary", { name: "Dictionary" })).toBeHidden();
  } else {
    await expect(page.getByRole("complementary", { name: "Dictionary" })).toContainText("time");
  }

  const outputName = testInfo.project.name === "mobile" ? "rhymepad-mobile.png" : "rhymepad-desktop.png";
  await page.screenshot({
    path: path.join(process.cwd(), "docs", "screenshots", outputName),
    fullPage: true
  });
});
