import { test, expect } from "../fixtures";
import { Page } from "@playwright/test";

const WIDGET_URL = "grist-widget/tableau-selecteur/";

type GlobalWithGrist = typeof globalThis & {
  __gristOnRecords: (records: unknown[], mappings: unknown) => void;
  __gristOnOptions: (options: unknown) => void;
  __gristOnEditOptions: () => void;
  __gristCursorPos: { rowId?: number };
  __gristStoredOptions: Record<string, unknown>;
  __gristColumnLabels: Record<string, string>;
};

const RECORDS = [
  { id: 1, nom: "Alice", ville: "Paris" },
  { id: 2, nom: "Bob", ville: "Lyon" },
];
const MAPPINGS = { Colonnes: ["nom", "ville"] };

async function injectRecords(page: Page, records: unknown[], mappings: unknown) {
  await page.evaluate(
    ({ r, m }) => {
      (globalThis as GlobalWithGrist).__gristOnRecords(r, m);
    },
    { r: records, m: mappings },
  );
}

async function injectOptions(page: Page, options: unknown) {
  await page.evaluate((opts) => {
    (globalThis as GlobalWithGrist).__gristOnOptions(opts);
  }, options);
}

test.describe("Tableau sélecteur", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(WIDGET_URL);
  });

  test("affiche le tableau quand les données arrivent", async ({ page }) => {
    await injectRecords(page, RECORDS, MAPPINGS);
    await expect(page.locator("table")).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(2);
  });

  test("utilise les libellés de colonnes comme en-têtes", async ({ page }) => {
    await page.evaluate(() => {
      (globalThis as GlobalWithGrist).__gristColumnLabels = {
        nom: "Nom complet",
        ville: "Ville",
      };
    });
    await injectRecords(page, RECORDS, MAPPINGS);
    await expect(page.locator("thead th", { hasText: "Nom complet" })).toBeVisible();
    await expect(page.locator("thead th", { hasText: "Ville" })).toBeVisible();
  });

  test("ouvre le ConfigPanel via onEditOptions", async ({ page }) => {
    await injectRecords(page, RECORDS, MAPPINGS);
    await page.evaluate(() => {
      (globalThis as GlobalWithGrist).__gristOnEditOptions();
    });
    await expect(page.getByText("Configuration du widget")).toBeVisible();
  });

  test("sauvegarde le titre et ferme le ConfigPanel", async ({ page }) => {
    await injectRecords(page, RECORDS, MAPPINGS);
    await page.evaluate(() => {
      (globalThis as GlobalWithGrist).__gristOnEditOptions();
    });
    await page.getByRole("textbox", { name: "Titre du tableau" }).fill("Mon tableau");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    const stored = await page.evaluate(
      () => (globalThis as GlobalWithGrist).__gristStoredOptions,
    );
    expect(stored.title).toBe("Mon tableau");
    await expect(page.locator("table")).toBeVisible();
  });

  test("sélectionner une ligne appelle setCursorPos", async ({ page }) => {
    await injectRecords(page, RECORDS, MAPPINGS);
    await injectOptions(page, { selectableRows: true });
    await page.locator("tbody tr").first().locator("span").first().click();
    const cursorPos = await page.evaluate(
      () => (globalThis as GlobalWithGrist).__gristCursorPos,
    );
    expect(cursorPos).toEqual({ rowId: 1 });
  });

  test("la ligne sélectionnée est mise en évidence quand onRecord est déclenché", async ({
    page,
  }) => {
    await injectRecords(page, RECORDS, MAPPINGS);
    await injectOptions(page, { selectableRows: true });
    await page.evaluate(() => {
      (globalThis as GlobalWithGrist).__gristOnRecord?.({ id: 2 });
    });
    const selectedSpan = page.locator("tbody tr").nth(1).locator(".ts-cell--selected").first();
    await expect(selectedSpan).toBeVisible();
  });
});
