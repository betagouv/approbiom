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

  test.describe("column selection", () => {
    test("shows only the selected column when one column is configured", async ({ page }) => {
      await page.evaluate(() => {
        (globalThis as GlobalWithGrist).__gristOnOptions({ selectedColumns: ["Nom"] });
        (globalThis as GlobalWithGrist).__gristOnRecords([{ id: 1, Nom: "Alice", Age: "30" }]);
      });
      await expect(page.locator("th").filter({ hasText: "Nom" })).toBeVisible();
      await expect(page.locator("th").filter({ hasText: "Age" })).not.toBeVisible();
    });

    test("shows alert when no columns are selected but records exist", async ({ page }) => {
      await page.evaluate(() => {
        (globalThis as GlobalWithGrist).__gristOnOptions({ selectedColumns: [] });
        (globalThis as GlobalWithGrist).__gristOnRecords([{ id: 1, Nom: "Alice", Age: "30" }]);
      });
      await expect(page.locator("table")).not.toBeVisible();
      await expect(page.locator(".fr-alert")).toBeVisible();
    });

    test("shows selected columns in their configured order", async ({ page }) => {
      await page.evaluate(() => {
        (globalThis as GlobalWithGrist).__gristOnOptions({ selectedColumns: ["Ville", "Nom"] });
        (globalThis as GlobalWithGrist).__gristOnRecords([
          { id: 1, Nom: "Alice", Age: "30", Ville: "Paris" },
        ]);
      });
      const headers = page.locator("th");
      await expect(headers.nth(0)).toHaveText("Ville");
      await expect(headers.nth(1)).toHaveText("Nom");
    });

    test("config panel shows visible and hidden sections", async ({ page }) => {
      await page.evaluate(() => {
        (globalThis as GlobalWithGrist).__gristOnOptions({ selectedColumns: ["Nom"] });
        (globalThis as GlobalWithGrist).__gristOnRecords([{ id: 1, Nom: "Alice", Age: "30" }]);
        (globalThis as GlobalWithGrist).__gristOnEditOptions();
      });
      await expect(page.locator(".column-item--visible").filter({ hasText: "Nom" })).toBeVisible();
      await expect(page.locator(".column-item--hidden").filter({ hasText: "Age" })).toBeVisible();
    });

    test("clicking add on a hidden column moves it to visible", async ({ page }) => {
      await page.evaluate(() => {
        (globalThis as GlobalWithGrist).__gristOnOptions({ selectedColumns: ["Nom"] });
        (globalThis as GlobalWithGrist).__gristOnRecords([{ id: 1, Nom: "Alice", Age: "30" }]);
        (globalThis as GlobalWithGrist).__gristOnEditOptions();
      });
      await page.locator(".column-item--hidden").filter({ hasText: "Age" }).getByRole("button").click();
      await expect(page.locator(".column-item--visible").filter({ hasText: "Age" })).toBeVisible();
      await expect(page.locator(".column-item--hidden").filter({ hasText: "Age" })).not.toBeVisible();
    });

    test("clicking hide on a visible column moves it to hidden", async ({ page }) => {
      await page.evaluate(() => {
        (globalThis as GlobalWithGrist).__gristOnOptions({ selectedColumns: ["Nom", "Age"] });
        (globalThis as GlobalWithGrist).__gristOnRecords([{ id: 1, Nom: "Alice", Age: "30" }]);
        (globalThis as GlobalWithGrist).__gristOnEditOptions();
      });
      await page.locator(".column-item--visible").filter({ hasText: "Nom" }).getByRole("button").click();
      await expect(page.locator(".column-item--hidden").filter({ hasText: "Nom" })).toBeVisible();
      await expect(page.locator(".column-item--visible").filter({ hasText: "Nom" })).not.toBeVisible();
    });

    test("drag and drop reorders visible columns", async ({ page }) => {
      await page.evaluate(() => {
        (globalThis as GlobalWithGrist).__gristOnOptions({ selectedColumns: ["Nom", "Age"] });
        (globalThis as GlobalWithGrist).__gristOnRecords([{ id: 1, Nom: "Alice", Age: "30" }]);
        (globalThis as GlobalWithGrist).__gristOnEditOptions();
      });
      await page.dragAndDrop('[data-col="Age"]', '[data-col="Nom"]');
      await page.locator("button", { hasText: "Enregistrer" }).click();
      const headers = page.locator("th");
      await expect(headers.nth(0)).toHaveText("Age");
      await expect(headers.nth(1)).toHaveText("Nom");
    });

    test("saves column selection and shows only selected columns in the table", async ({
      page,
    }) => {
      await page.evaluate(() => {
        (globalThis as GlobalWithGrist).__gristOnOptions({ selectedColumns: [] });
        (globalThis as GlobalWithGrist).__gristOnRecords([{ id: 1, Nom: "Alice", Age: "30" }]);
        (globalThis as GlobalWithGrist).__gristOnEditOptions();
      });
      await page.locator(".column-item--hidden").filter({ hasText: "Nom" }).getByRole("button").click();
      await page.locator("button", { hasText: "Enregistrer" }).click();
      await expect(page.locator("th").filter({ hasText: "Nom" })).toBeVisible();
      await expect(page.locator("th").filter({ hasText: "Age" })).not.toBeVisible();
    });
  });
});
