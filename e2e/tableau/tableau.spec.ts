import { test, expect } from "../fixtures";

const WIDGET_URL = "grist-widget/vue-tableau/";

type GlobalWithGrist = typeof globalThis & {
  __gristOnRecords: (records: unknown[]) => void;
  __gristOnOptions: (options: unknown) => void;
  __gristOnEditOptions: () => void;
};

test.describe("Vue Tableau", () => {
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

  test("table body fills the full viewport width", async ({ page }) => {
    await page.evaluate(() => {
      (globalThis as GlobalWithGrist).__gristOnRecords([{ id: 1, Nom: "Alice", Age: "30" }]);
    });
    const table = page.locator("tbody");
    await expect(table).toBeVisible();
    const tableBox = await table.boundingBox();
    const viewportSize = page.viewportSize();
    expect(tableBox?.width).toBe(viewportSize?.width);
  });

  test("shows DSFR alert when no records", async ({ page }) => {
    await page.evaluate(() => {
      (globalThis as GlobalWithGrist).__gristOnRecords([]);
    });
    await expect(page.locator("table")).not.toBeVisible();
    await expect(page.locator(".fr-alert")).toBeVisible();
  });

  test.describe("title configuration", () => {
    test("shows default title when no options are configured", async ({ page }) => {
      await page.evaluate(() => {
        (globalThis as GlobalWithGrist).__gristOnRecords([{ id: 1, Nom: "Alice" }]);
      });
      await expect(page.locator("caption")).toHaveText("Données du tableau");
    });

    test("shows custom title from Grist options", async ({ page }) => {
      await page.evaluate(() => {
        (globalThis as GlobalWithGrist).__gristOnOptions({ title: "Mon tableau personnalisé" });
        (globalThis as GlobalWithGrist).__gristOnRecords([{ id: 1, Nom: "Alice" }]);
      });
      await expect(page.locator("caption")).toHaveText("Mon tableau personnalisé");
    });

    test("falls back to default title when options title is empty", async ({ page }) => {
      await page.evaluate(() => {
        (globalThis as GlobalWithGrist).__gristOnOptions({ title: "" });
        (globalThis as GlobalWithGrist).__gristOnRecords([{ id: 1, Nom: "Alice" }]);
      });
      await expect(page.locator("caption")).toHaveText("Données du tableau");
    });

    test("opens configuration panel when onEditOptions is triggered", async ({ page }) => {
      await page.evaluate(() => {
        (globalThis as GlobalWithGrist).__gristOnEditOptions();
      });
      await expect(page.getByLabel("Titre du tableau")).toBeVisible();
    });

    test("saves new title and updates the table display", async ({ page }) => {
      await page.evaluate(() => {
        (globalThis as GlobalWithGrist).__gristOnRecords([{ id: 1, Nom: "Alice" }]);
        (globalThis as GlobalWithGrist).__gristOnEditOptions();
      });
      await page.getByLabel("Titre du tableau").fill("Nouveau titre");
      await page.locator("button", { hasText: "Enregistrer" }).click();
      await expect(page.locator("caption")).toHaveText("Nouveau titre");
    });
  });
});
