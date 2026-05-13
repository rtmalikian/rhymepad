import { expect, test, type Page } from "@playwright/test";

async function selectTextPosition(page: Page, position: number) {
  await page.getByLabel("Rhyme writing notepad").evaluate((element, caretPosition) => {
    const textarea = element as HTMLTextAreaElement;
    textarea.focus();
    textarea.setSelectionRange(Math.max(0, caretPosition - 1), Math.max(0, caretPosition - 1));
  }, position);
  await page.keyboard.press("ArrowRight");
}

test("renders syllables, rhyme colors, and dictionary actions", async ({ page, isMobile }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /dictionary/i })).toBeHidden({ timeout: 100 }).catch(() => undefined);
  await expect(page.getByLabel("Rhyme writing notepad")).toBeVisible();
  await expect(page.getByText("Saved to SQLite")).toBeVisible();
  await page.getByLabel("Rhyme writing notepad").fill("I write in time while city lights shine\nCold flow rolls through the line");
  await expect(page.getByText("Find Internal Rhymes")).toBeVisible();
  await expect(page.locator(".word-count").first()).toBeVisible();
  await expect(page.locator(".line-total").first()).toBeVisible();

  await selectTextPosition(page, 12);
  const popover = page.getByRole("dialog", { name: /Rhyming dictionary for time/i });
  await expect(popover).toBeVisible();
  const dictionary = page.getByRole("complementary", { name: "Dictionary" });
  const activeDictionary = isMobile ? popover : dictionary;
  if (isMobile) {
    await expect(dictionary).toBeHidden();
  } else {
    await expect(dictionary).toContainText("time");
  }
  await expect(activeDictionary.getByText("Perfect")).toBeVisible();
  await expect(activeDictionary.getByText("Slant")).toBeVisible();
  await expect(activeDictionary.getByText("Multi", { exact: true })).toBeVisible();

  if (isMobile) return;

  const before = await page.getByLabel("Rhyme writing notepad").inputValue();
  await page.getByRole("button", { name: "Insert" }).first().click();
  const after = await page.getByLabel("Rhyme writing notepad").inputValue();
  expect(after.length).toBeGreaterThan(before.length);
});

test("mobile dictionary is compact and closable", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile-only dictionary sheet behavior");

  await page.goto("/");
  const editor = page.getByLabel("Rhyme writing notepad");
  await editor.fill("Paranoia in the fire\nHigher wires never tire");
  await selectTextPosition(page, 3);

  const popover = page.getByRole("dialog", { name: /Rhyming dictionary for Paranoia/i });
  await expect(popover).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Dictionary" })).toBeHidden();

  const box = await popover.boundingBox();
  expect(box?.height ?? 0).toBeLessThanOrEqual(290);

  await popover.getByRole("button", { name: "Close dictionary" }).click();
  await expect(popover).toBeHidden();

  await editor.click({ position: { x: 10, y: 90 } });
  await editor.pressSequentially(" new");
  await expect(editor).toHaveValue(/new/);
});
