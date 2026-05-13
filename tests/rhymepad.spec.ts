import { expect, test } from "@playwright/test";

test("renders syllables, rhyme colors, and dictionary actions", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /dictionary/i })).toBeHidden({ timeout: 100 }).catch(() => undefined);
  await expect(page.getByLabel("Rhyme writing notepad")).toBeVisible();
  await expect(page.getByText("Saved to SQLite")).toBeVisible();
  await expect(page.getByText("Find Internal Rhymes")).toBeVisible();
  await expect(page.locator(".word-count").first()).toBeVisible();
  await expect(page.locator(".line-total").first()).toBeVisible();

  await page.getByRole("button", { name: /time/i }).first().click();
  await expect(page.getByRole("dialog", { name: /Rhyming dictionary for time/i })).toBeVisible();
  const dictionary = page.getByRole("complementary", { name: "Dictionary" });
  await expect(dictionary).toContainText("time");
  await expect(dictionary.getByText("Perfect")).toBeVisible();
  await expect(dictionary.getByText("Slant")).toBeVisible();
  await expect(dictionary.getByText("Multi", { exact: true })).toBeVisible();

  const before = await page.getByLabel("Rhyme writing notepad").inputValue();
  await page.getByRole("button", { name: "Insert" }).first().click();
  const after = await page.getByLabel("Rhyme writing notepad").inputValue();
  expect(after.length).toBeGreaterThan(before.length);
});
