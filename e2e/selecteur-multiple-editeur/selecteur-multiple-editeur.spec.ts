import { test, expect } from "../fixtures";
import { Page } from "@playwright/test";

const WIDGET_URL = "grist-widget/selecteur-multiple-editeur/";

type GlobalWithGrist = typeof globalThis & {
  __gristOnOptions: (options: unknown) => void;
};

async function injectOptions(page: Page, opts: unknown) {
  await page.evaluate((o) => {
    (globalThis as GlobalWithGrist).__gristOnOptions(o);
  }, opts);
}

test.describe("Sélecteur multiple éditeur — RefList column override", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(WIDGET_URL);
  });

  test("shows info alert when no column is configured", async ({ page }) => {
    await injectOptions(page, {});
    await expect(page.locator(".fr-alert--info")).toBeVisible();
  });
});
