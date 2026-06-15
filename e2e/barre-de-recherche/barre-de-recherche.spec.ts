import { test, expect } from "../fixtures";
import { Page } from "@playwright/test";

const WIDGET_URL = "grist-widget/barre-de-recherche/";

type GlobalWithGrist = typeof globalThis & {
  __gristOnRecords: (records: unknown[], mappings: unknown) => void;
  __gristOnRecord: (record: { id: number; [key: string]: unknown } | null) => void;
  __gristSelectedRows: number[] | null;
  __gristCursorPos: { rowId: number } | undefined;
  __gristOnOptions: (options: unknown) => void;
  __gristOnEditOptions: () => void;
  __gristStoredOptions: Record<string, unknown>;
  __gristColumnLabels: Record<string, string>;
  __gristColumnTypes: Record<string, string>;
  __gristWidgetOptions: Record<string, string>;
};

const RECORDS = [
  { id: 1, ville: "Paris", metier: "Médecin" },
  { id: 2, ville: "Lyon", metier: "Architecte" },
  { id: 3, ville: "Marseille", metier: "Médiatrice" },
];

const MAPPINGS_ONE = { ColonnesRecherche: "ville" };
const MAPPINGS_TWO = { ColonnesRecherche: ["ville", "metier"] };
const MAPPINGS_CHOICES = { ColonnesRecherche: "ville", ColonnesAFiltrer: "categorie" };

async function injectRecord(page: Page, record: { id: number; [key: string]: unknown } | null) {
  await page.waitForFunction(
    () => typeof (globalThis as GlobalWithGrist).__gristOnRecord === "function",
  );
  await page.evaluate((r) => {
    (globalThis as GlobalWithGrist).__gristOnRecord(r);
  }, record);
}

async function injectRecords(page: Page, records: unknown[], mappings: unknown) {
  await page.evaluate(
    ({ r, m }) => {
      (globalThis as GlobalWithGrist).__gristOnRecords(r, m);
    },
    { r: records, m: mappings },
  );
}

async function injectOptions(page: Page, opts: unknown) {
  await page.evaluate((o) => {
    (globalThis as GlobalWithGrist).__gristOnOptions(o);
  }, opts);
}

async function setColumnMeta(
  page: Page,
  labels: Record<string, string>,
  types: Record<string, string>,
  widgetOptions: Record<string, string> = {},
) {
  await page.evaluate(
    ({ l, t, w }) => {
      const g = globalThis as GlobalWithGrist;
      g.__gristColumnLabels = l;
      g.__gristColumnTypes = t;
      g.__gristWidgetOptions = w;
    },
    { l: labels, t: types, w: widgetOptions },
  );
}

const RECORDS_CHOICES = [
  { id: 1, ville: "Paris", categorie: "A" },
  { id: 2, ville: "Lyon", categorie: "B" },
  { id: 3, ville: "Marseille", categorie: "A" },
];

const CHOICE_META = {
  labels: { ville: "Ville", categorie: "Catégorie" },
  types: { ville: "Text", categorie: "Choice" },
  widgetOptions: { categorie: '{"choices":["A","B","C"]}' },
};

test.describe("Barre de recherche", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(WIDGET_URL);
  });

  test("affiche une alerte info si aucune colonne n'est mappée", async ({ page }) => {
    await injectRecords(page, [], null);
    await expect(page.locator(".fr-alert--info")).toBeVisible();
  });

  test("affiche la barre de recherche quand les données arrivent", async ({ page }) => {
    await injectRecords(page, RECORDS, MAPPINGS_ONE);
    await expect(page.locator('input[type="search"]')).toBeVisible();
  });

  test("filtre les lignes (insensible à la casse)", async ({ page }) => {
    await injectRecords(page, RECORDS, MAPPINGS_ONE);
    await page.locator('input[type="search"]').fill("par");
    const selected = await page.evaluate(() => (globalThis as GlobalWithGrist).__gristSelectedRows);
    expect(selected).toEqual([1]);
  });

  test("réinitialise la sélection quand le champ est vidé", async ({ page }) => {
    await injectRecords(page, RECORDS, MAPPINGS_ONE);
    await page.locator('input[type="search"]').fill("lyon");
    await page.locator('input[type="search"]').fill("");
    const selected = await page.evaluate(() => (globalThis as GlobalWithGrist).__gristSelectedRows);
    expect(selected).toBeNull();
  });

  test("recherche via la touche Entrée", async ({ page }) => {
    await injectRecords(page, RECORDS, MAPPINGS_ONE);
    const input = page.locator('input[type="search"]');
    await input.fill("marseille");
    await input.press("Enter");
    const selected = await page.evaluate(() => (globalThis as GlobalWithGrist).__gristSelectedRows);
    expect(selected).toEqual([3]);
  });

  test("filtre sur plusieurs colonnes simultanément", async ({ page }) => {
    await injectRecords(page, RECORDS, MAPPINGS_TWO);
    // "méd" matches "Médecin" (Paris, id=1) AND "Médiatrice" (Marseille, id=3)
    await page.locator('input[type="search"]').fill("méd");
    const selected = await page.evaluate(() => (globalThis as GlobalWithGrist).__gristSelectedRows);
    expect(selected).toEqual([1, 3]);
  });

  test("une correspondance dans n'importe quelle colonne sélectionne la ligne", async ({
    page,
  }) => {
    await injectRecords(page, RECORDS, MAPPINGS_TWO);
    // "arch" matches "Architecte" (Lyon, id=2) but not any ville
    await page.locator('input[type="search"]').fill("arch");
    const selected = await page.evaluate(() => (globalThis as GlobalWithGrist).__gristSelectedRows);
    expect(selected).toEqual([2]);
  });

  test("affiche les tags configurées dans le widget", async ({ page }) => {
    await setColumnMeta(page, CHOICE_META.labels, CHOICE_META.types, CHOICE_META.widgetOptions);
    await injectOptions(page, {
      tagFilters: [{ colId: "categorie", value: "A", colType: "Choice" }],
    });
    await injectRecords(page, RECORDS_CHOICES, MAPPINGS_CHOICES);

    await expect(page.locator("button.fr-tag", { hasText: /Catégorie : A/ })).toBeVisible();
  });

  test("le filtre par tag actif sélectionne les lignes correspondantes", async ({ page }) => {
    await setColumnMeta(page, CHOICE_META.labels, CHOICE_META.types, CHOICE_META.widgetOptions);
    await injectOptions(page, {
      tagFilters: [{ colId: "categorie", value: "A", colType: "Choice" }],
    });
    // ColonnesAFiltrer maps categorie so records include it; no search column needed
    await injectRecords(page, RECORDS_CHOICES, { ColonnesAFiltrer: "categorie" });

    const selected = await page.evaluate(() => (globalThis as GlobalWithGrist).__gristSelectedRows);
    expect(selected).toEqual([1, 3]);
  });

  test("la recherche combinée avec un tag actif applique les deux filtres (AND)", async ({
    page,
  }) => {
    await setColumnMeta(page, CHOICE_META.labels, CHOICE_META.types, CHOICE_META.widgetOptions);
    await injectOptions(page, {
      tagFilters: [{ colId: "categorie", value: "A", colType: "Choice" }],
    });
    await injectRecords(page, RECORDS_CHOICES, MAPPINGS_CHOICES);

    // Tag "A" active → ids [1, 3]; search "paris" → id [1]; AND → [1]
    await page.locator('input[type="search"]').fill("paris");

    const selected = await page.evaluate(() => (globalThis as GlobalWithGrist).__gristSelectedRows);
    expect(selected).toEqual([1]);
  });

  test("cliquer sur Enregistrer dans le panneau de configuration sauvegarde les filtres", async ({
    page,
  }) => {
    await setColumnMeta(page, CHOICE_META.labels, CHOICE_META.types, CHOICE_META.widgetOptions);
    // injectOptions triggers onOptions → loadChoiceColumns (async)
    await injectOptions(page, {});
    // Set ColonnesAFiltrer mapping so filteredChoiceColumns includes "categorie"
    await injectRecords(page, [], { ColonnesAFiltrer: "categorie" });

    // Open config panel
    await page.evaluate(() => (globalThis as GlobalWithGrist).__gristOnEditOptions());

    // Wait for the column dropdown to have options loaded (waits for loadChoiceColumns to complete)
    await expect(page.getByLabel("Colonne")).toBeVisible();
    await page.getByLabel("Colonne").selectOption({ label: "Catégorie" });
    await page.getByLabel("Valeur").selectOption("A");
    await page.getByRole("button", { name: "Ajouter ce filtre" }).click();
    await page.getByRole("button", { name: "Enregistrer" }).click();

    const stored = await page.evaluate(() => (globalThis as GlobalWithGrist).__gristStoredOptions);
    expect(stored?.tagFilters).toEqual([{ colId: "categorie", value: "A", colType: "Choice" }]);
  });

  test("la barre de recherche et les tags sont sur la même ligne (large fenêtre)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    await setColumnMeta(page, CHOICE_META.labels, CHOICE_META.types, CHOICE_META.widgetOptions);
    await injectOptions(page, {
      tagFilters: [{ colId: "categorie", value: "A", colType: "Choice" }],
    });
    await injectRecords(page, RECORDS_CHOICES, MAPPINGS_CHOICES);

    const searchBar = page.locator(".fr-search-bar");
    const tagsGroup = page.locator(".fr-tags-group");

    await expect(searchBar).toBeVisible();
    await expect(tagsGroup).toBeVisible();

    const searchBox = await searchBar.boundingBox();
    const tagsBox = await tagsGroup.boundingBox();

    expect(searchBox).not.toBeNull();
    expect(tagsBox).not.toBeNull();

    // Both elements should share the same horizontal line:
    // tags top is within the vertical span of the search bar (±10px tolerance)
    expect(tagsBox!.y).toBeGreaterThanOrEqual(searchBox!.y - 10);
    expect(tagsBox!.y).toBeLessThan(searchBox!.y + searchBox!.height + 10);
  });

  test("les tags passent sous la barre de recherche quand la fenêtre est trop étroite", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 600 });
    await setColumnMeta(page, CHOICE_META.labels, CHOICE_META.types, CHOICE_META.widgetOptions);
    await injectOptions(page, {
      tagFilters: [
        { colId: "categorie", value: "A", colType: "Choice" },
        { colId: "categorie", value: "B", colType: "Choice" },
        { colId: "categorie", value: "C", colType: "Choice" },
      ],
    });
    await injectRecords(page, RECORDS_CHOICES, MAPPINGS_CHOICES);

    const searchBar = page.locator(".fr-search-bar");
    const tagsGroup = page.locator(".fr-tags-group");

    await expect(searchBar).toBeVisible();
    await expect(tagsGroup).toBeVisible();

    const searchBox = await searchBar.boundingBox();
    const tagsBox = await tagsGroup.boundingBox();

    expect(searchBox).not.toBeNull();
    expect(tagsBox).not.toBeNull();

    // Tags should have wrapped below the search bar
    expect(tagsBox!.y).toBeGreaterThanOrEqual(searchBox!.y + searchBox!.height - 5);
  });

  test("le curseur reste sur la ligne courante si elle est encore dans les résultats", async ({
    page,
  }) => {
    await injectRecords(page, RECORDS, MAPPINGS_ONE);
    await injectRecord(page, { id: 1, ville: "Paris" });

    await page.locator('input[type="search"]').fill("par");

    const cursorPos = await page.evaluate(() => (globalThis as GlobalWithGrist).__gristCursorPos);
    expect(cursorPos).toBeUndefined();
  });

  test("le curseur se déplace vers le premier résultat si la ligne courante disparaît du filtre", async ({
    page,
  }) => {
    await injectRecords(page, RECORDS, MAPPINGS_ONE);
    await injectRecord(page, { id: 2, ville: "Lyon" });

    await page.locator('input[type="search"]').fill("paris");

    const cursorPos = await page.evaluate(() => (globalThis as GlobalWithGrist).__gristCursorPos);
    expect(cursorPos).toEqual({ rowId: 1 });
  });
});
