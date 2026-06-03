import { test, expect } from "../fixtures";

const WIDGET_URL = "grist-widget/carte-departement/";

type GlobalWithGrist = typeof globalThis & {
  __gristOnRecord: (record: unknown, mappings: unknown) => void;
};

test.describe("carte-departement", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(WIDGET_URL);
  });

  test("renders the map container", async ({ page }) => {
    await expect(page.locator("#map")).toBeVisible();
  });

  test("shows a warning when mappings are missing", async ({ page }) => {
    await page.evaluate(() => {
      (globalThis as GlobalWithGrist).__gristOnRecord(null, null);
    });

    await expect(page.locator(".fr-alert--sm")).toBeVisible();
  });

  test("shows the map without warnings for a valid department code", async ({ page }) => {
    await page.evaluate(() => {
      (globalThis as GlobalWithGrist).__gristOnRecord({ col: "75" }, { DDEP_C_COD: "col" });
    });
    await expect(page.locator(".fr-alert")).not.toBeVisible();
    await expect(page.locator("#map")).toBeVisible();
  });

  test("shows a warning for an unrecognised department code", async ({ page }) => {
    await page.evaluate(() => {
      (globalThis as GlobalWithGrist).__gristOnRecord({ col: "99" }, { DDEP_C_COD: "col" });
    });
    await expect(page.locator(".fr-alert")).toBeVisible();
  });
});
