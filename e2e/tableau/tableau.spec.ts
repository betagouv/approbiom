import { test, expect } from "../fixtures";

const WIDGET_URL = "grist-widget/tableau/";

type GlobalWithGrist = typeof globalThis & {
  __gristOnRecords: (records: unknown[]) => void;
};

test.describe("tableau", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(WIDGET_URL);
  });

  test("renders the table with records", async ({ page }) => {
    await page.evaluate(() => {
      (globalThis as GlobalWithGrist).__gristOnRecords([
        { id: 1, Nom: "Alice", Age: "30" },
        { id: 2, Nom: "Bob", Age: "25" },
      ]);
    });
    await expect(page.locator("table")).toBeVisible();
  });

  test("renders column headers from record keys", async ({ page }) => {
    await page.evaluate(() => {
      (globalThis as GlobalWithGrist).__gristOnRecords([{ id: 1, Nom: "Alice", Age: "30" }]);
    });
    await expect(page.locator("th").filter({ hasText: "Nom" })).toBeVisible();
    await expect(page.locator("th").filter({ hasText: "Age" })).toBeVisible();
  });

  test("renders row data", async ({ page }) => {
    await page.evaluate(() => {
      (globalThis as GlobalWithGrist).__gristOnRecords([{ id: 1, Nom: "Alice", Age: "30" }]);
    });
    await expect(page.locator("td").filter({ hasText: "Alice" })).toBeVisible();
  });

  test("shows DSFR alert when no records", async ({ page }) => {
    await page.evaluate(() => {
      (globalThis as GlobalWithGrist).__gristOnRecords([]);
    });
    await expect(page.locator("table")).not.toBeVisible();
    await expect(page.locator(".fr-alert")).toBeVisible();
  });
});
