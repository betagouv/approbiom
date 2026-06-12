import { test, expect } from "../fixtures";
import { Page } from "@playwright/test";

const WIDGET_URL = "grist-widget/tableau-selecteur/";

type GlobalWithGrist = typeof globalThis & {
  __gristOnRecords: (records: unknown[], mappings: unknown) => void;
  __gristOnRecord: (record: unknown) => void;
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

  test("affiche une alerte quand aucune colonne n'est configurée", async ({ page }) => {
    await injectRecords(page, RECORDS, { Colonnes: [] });
    await expect(page.locator(".fr-alert")).toBeVisible();
    await expect(page.locator("table")).not.toBeVisible();
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

  test("les données du tableau correspondent aux enregistrements injectés", async ({ page }) => {
    await injectRecords(page, RECORDS, MAPPINGS);
    const cells = page.locator("tbody td");
    await expect(cells.nth(0)).toHaveText("Alice");
    await expect(cells.nth(1)).toHaveText("Paris");
    await expect(cells.nth(2)).toHaveText("Bob");
    await expect(cells.nth(3)).toHaveText("Lyon");
  });

  test("affiche le titre du tableau dans la caption", async ({ page }) => {
    await injectOptions(page, { title: "Mes agents" });
    await injectRecords(page, RECORDS, MAPPINGS);
    await expect(page.locator("caption")).toHaveText("Mes agents");
  });

  test.describe("sélection de ligne", () => {
    test("cliquer sur une ligne appelle setCursorPos avec l'id du record", async ({ page }) => {
      await injectRecords(page, RECORDS, MAPPINGS);
      await page.locator("tbody tr").first().click();
      const cursorPos = await page.evaluate(
        () => (globalThis as GlobalWithGrist).__gristCursorPos,
      );
      expect(cursorPos).toEqual({ rowId: 1 });
    });

    test("cliquer sur une ligne ajoute fr-tr--selected sur la ligne", async ({ page }) => {
      await injectRecords(page, RECORDS, MAPPINGS);
      const firstRow = page.locator("tbody tr").first();
      await firstRow.click();
      await expect(firstRow).toHaveClass(/fr-tr--selected/);
    });

    test("changer de ligne déplace la classe fr-tr--selected", async ({ page }) => {
      await injectRecords(page, RECORDS, MAPPINGS);
      const firstRow = page.locator("tbody tr").nth(0);
      const secondRow = page.locator("tbody tr").nth(1);

      await firstRow.click();
      await expect(firstRow).toHaveClass(/fr-tr--selected/);

      await secondRow.click();
      await expect(secondRow).toHaveClass(/fr-tr--selected/);
      await expect(firstRow).not.toHaveClass(/fr-tr--selected/);
    });

    test("Entrée clavier sur une ligne appelle setCursorPos", async ({ page }) => {
      await injectRecords(page, RECORDS, MAPPINGS);
      // Dispatch the event directly on the tr to test the keydown handler via bubbling
      await page.evaluate(() => {
        const tr = document.querySelector("tbody tr") as HTMLElement;
        tr?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      });
      const cursorPos = await page.evaluate(
        () => (globalThis as GlobalWithGrist).__gristCursorPos,
      );
      expect(cursorPos).toEqual({ rowId: 1 });
    });

    test("Espace clavier sur une ligne appelle setCursorPos", async ({ page }) => {
      await injectRecords(page, RECORDS, MAPPINGS);
      await page.evaluate(() => {
        const tr = document.querySelector("tbody tr") as HTMLElement;
        tr?.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
      });
      const cursorPos = await page.evaluate(
        () => (globalThis as GlobalWithGrist).__gristCursorPos,
      );
      expect(cursorPos).toEqual({ rowId: 1 });
    });

    test("la ligne sélectionnée est mise en évidence quand onRecord est déclenché", async ({
      page,
    }) => {
      await injectRecords(page, RECORDS, MAPPINGS);
      await page.evaluate(() => {
        (globalThis as GlobalWithGrist).__gristOnRecord({ id: 2 });
      });
      const secondRow = page.locator("tbody tr").nth(1);
      await expect(secondRow).toHaveClass(/fr-tr--selected/);
    });

    test("onRecord null efface la sélection visuelle", async ({ page }) => {
      await injectRecords(page, RECORDS, MAPPINGS);
      await page.evaluate(() => {
        (globalThis as GlobalWithGrist).__gristOnRecord({ id: 1 });
      });
      const firstRow = page.locator("tbody tr").first();
      await expect(firstRow).toHaveClass(/fr-tr--selected/);

      await page.evaluate(() => {
        (globalThis as GlobalWithGrist).__gristOnRecord(null);
      });
      await expect(firstRow).not.toHaveClass(/fr-tr--selected/);
    });
  });

  test.describe("ConfigPanel", () => {
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

    test("Annuler ferme le ConfigPanel sans sauvegarder", async ({ page }) => {
      await injectRecords(page, RECORDS, MAPPINGS);
      await injectOptions(page, { title: "Titre initial" });
      await page.evaluate(() => {
        (globalThis as GlobalWithGrist).__gristOnEditOptions();
      });
      await page.getByRole("textbox", { name: "Titre du tableau" }).fill("Titre modifié");
      await page.getByRole("button", { name: "Annuler" }).click();

      await expect(page.getByText("Configuration du widget")).not.toBeVisible();
      await expect(page.locator("caption")).not.toHaveText("Titre modifié");
    });
  });
});
