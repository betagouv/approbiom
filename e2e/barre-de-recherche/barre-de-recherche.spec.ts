import { test, expect } from "../fixtures";
import { Page } from "@playwright/test";

const WIDGET_URL = "grist-widget/barre-de-recherche/";

type GlobalWithGrist = typeof globalThis & {
  __gristOnRecords: (records: unknown[], mappings: unknown) => void;
  __gristSelectedRows: number[] | null;
};

const RECORDS = [
  { id: 1, ville: "Paris" },
  { id: 2, ville: "Lyon" },
  { id: 3, ville: "Marseille" },
];

const MAPPINGS = { ColonneRecherche: "ville" };

async function injectRecords(page: Page, records: unknown[], mappings: unknown) {
  await page.evaluate(
    ({ r, m }) => {
      (globalThis as GlobalWithGrist).__gristOnRecords(r, m);
    },
    { r: records, m: mappings },
  );
}

test.describe("Barre de recherche", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(WIDGET_URL);
  });

  test("affiche une alerte info si aucune colonne n'est mappée", async ({ page }) => {
    await injectRecords(page, [], null);
    await expect(page.locator(".fr-alert--info")).toBeVisible();
  });

  test("affiche la barre de recherche quand les données arrivent", async ({ page }) => {
    await injectRecords(page, RECORDS, MAPPINGS);
    await expect(page.locator('input[type="search"]')).toBeVisible();
  });

  test("filtre les lignes (insensible à la casse)", async ({ page }) => {
    await injectRecords(page, RECORDS, MAPPINGS);
    await page.locator('input[type="search"]').fill("par");
    const selected = await page.evaluate(
      () => (globalThis as GlobalWithGrist).__gristSelectedRows,
    );
    expect(selected).toEqual([1]);
  });

  test("réinitialise la sélection quand le champ est vidé", async ({ page }) => {
    await injectRecords(page, RECORDS, MAPPINGS);
    await page.locator('input[type="search"]').fill("lyon");
    await page.locator('input[type="search"]').fill("");
    const selected = await page.evaluate(
      () => (globalThis as GlobalWithGrist).__gristSelectedRows,
    );
    expect(selected).toBeNull();
  });

  test("recherche via la touche Entrée", async ({ page }) => {
    await injectRecords(page, RECORDS, MAPPINGS);
    const input = page.locator('input[type="search"]');
    await input.fill("marseille");
    await input.press("Enter");
    const selected = await page.evaluate(
      () => (globalThis as GlobalWithGrist).__gristSelectedRows,
    );
    expect(selected).toEqual([3]);
  });
});
