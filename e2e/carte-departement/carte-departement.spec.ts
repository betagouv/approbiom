import { test, expect } from "@playwright/test";

const MOCK_PATH = "e2e/mocks/grist-plugin-api.js";
const WIDGET_URL = "grist-widget/carte-departement/";

test.describe("carte-departement", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("https://docs.getgrist.com/grist-plugin-api.js", (route) =>
      route.fulfill({ contentType: "application/javascript", path: MOCK_PATH }),
    );
    await page.goto(WIDGET_URL);
  });

  test("renders the map container", async ({ page }) => {
    await expect(page.locator("#map")).toBeVisible();
  });

  test("shows a warning when mappings are missing", async ({ page }) => {
    await page.evaluate(() => {
      (globalThis as any).__gristOnRecord(null, null);
    });
    // App.vue renders its alert with :small="true" → fr-alert--sm; use that to
    // avoid strict-mode ambiguity with CarteDepartement's concurrently-visible alert.
    await expect(page.locator(".fr-alert--sm")).toBeVisible();
  });

  test("shows the map without warnings for a valid department code", async ({ page }) => {
    await page.evaluate(() => {
      (globalThis as any).__gristOnRecord({ col: "75" }, { DDEP_C_COD: "col" });
    });
    await expect(page.locator(".fr-alert")).not.toBeVisible();
    await expect(page.locator("#map")).toBeVisible();
  });

  test("shows a warning for an unrecognised department code", async ({ page }) => {
    await page.evaluate(() => {
      (globalThis as any).__gristOnRecord({ col: "99" }, { DDEP_C_COD: "col" });
    });
    await expect(page.locator(".fr-alert")).toBeVisible();
  });
});
