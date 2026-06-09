import { test, expect } from "../fixtures";
import { Page } from "@playwright/test";

const WIDGET_URL = "grist-widget/liste-deroulante-riche/";

type GlobalWithGrist = typeof globalThis & {
  __gristOnRecords: (records: unknown[], mappings: unknown) => void;
  __gristOnOptions: (options: unknown) => void;
  __gristOnEditOptions: () => void;
  __gristSelectedRows: number[];
  __gristAllowSelectByCalled: boolean;
};

const SMALL_LIST = [
  { id: 1, nom: "Alice" },
  { id: 2, nom: "Bob" },
  { id: 3, nom: "Charlie" },
];

const LARGE_LIST = Array.from({ length: 55 }, (_, i) => ({
  id: i + 1,
  nom: i === 0 ? "Recherche spéciale" : `Option ${i + 1}`,
}));

const MAPPINGS = { label: "nom" };

/** Injects records and mappings into the widget via the mock Grist API. */
async function injectRecords(page: Page, records: unknown[], mappings: unknown) {
  await page.evaluate(
    ({ r, m }) => {
      (globalThis as GlobalWithGrist).__gristOnRecords(r, m);
    },
    { r: records, m: mappings },
  );
}

/** Injects widget options via the mock Grist API. */
async function injectOptions(page: Page, options: Record<string, unknown>) {
  await page.evaluate((opts) => {
    (globalThis as GlobalWithGrist).__gristOnOptions(opts);
  }, options);
}

test.describe("Liste déroulante riche", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(WIDGET_URL);
  });

  // ─── allowSelectBy ───────────────────────────────────────────────────────────

  test("allowSelectBy is declared via the ready payload", async ({ page }) => {
    const called = await page.evaluate(
      () => (globalThis as GlobalWithGrist).__gristAllowSelectByCalled,
    );
    expect(called).toBe(true);
  });

  // ─── Alert states ─────────────────────────────────────────────────────────────

  test("shows info alert when records list is empty but column is mapped", async ({ page }) => {
    await injectRecords(page, [], MAPPINGS);
    await expect(page.locator(".fr-alert--info")).toBeVisible();
  });

  test("shows no alert when data is valid", async ({ page }) => {
    await injectRecords(page, [{ id: 1, nom: "Alice" }], MAPPINGS);
    await expect(page.locator(".fr-alert")).not.toBeVisible();
  });

  // ─── Rendering ───────────────────────────────────────────────────────────────

  test("renders the trigger button with default placeholder when nothing is selected", async ({
    page,
  }) => {
    await injectRecords(page, SMALL_LIST, MAPPINGS);
    const trigger = page.locator("button.fr-select.fr-multiselect");
    await expect(trigger).toBeVisible();
    await expect(trigger).toContainText("Sélectionner une option");
  });

  test("renders a large list without overflowing the viewport", async ({ page }) => {
    await injectRecords(page, LARGE_LIST, MAPPINGS);
    await page.locator("button.fr-select.fr-multiselect").click();
    const collapse = page.locator(".fr-multiselect__collapse");
    await expect(collapse).toBeVisible();
    const box = await collapse.boundingBox();
    const viewport = page.viewportSize();
    expect(box?.height).toBeLessThanOrEqual(viewport?.height ?? 0);
  });

  // ─── Dropdown open/close ─────────────────────────────────────────────────────

  test("opens the dropdown on trigger click", async ({ page }) => {
    await injectRecords(page, SMALL_LIST, MAPPINGS);
    await page.locator("button.fr-select.fr-multiselect").click();
    await expect(page.locator(".fr-multiselect__collapse")).toBeVisible();
  });

  test("closes the dropdown on a second trigger click", async ({ page }) => {
    await injectRecords(page, SMALL_LIST, MAPPINGS);
    const trigger = page.locator("button.fr-select.fr-multiselect");
    await trigger.click();
    await trigger.click();
    await expect(page.locator(".fr-multiselect__collapse")).not.toBeVisible();
  });

  // ─── Selection ───────────────────────────────────────────────────────────────

  test("checking one option calls setSelectedRows with its id", async ({ page }) => {
    await injectRecords(page, SMALL_LIST, MAPPINGS);
    await page.locator("button.fr-select.fr-multiselect").click();
    await page.locator(".fr-multiselect__collapse__fieldset label").first().click();
    const selectedRows = await page.evaluate(
      () => (globalThis as GlobalWithGrist).__gristSelectedRows,
    );
    expect(selectedRows).toEqual([1]);
  });

  test("checking multiple options accumulates ids in setSelectedRows", async ({ page }) => {
    await injectRecords(page, SMALL_LIST, MAPPINGS);
    await injectOptions(page, { enableMultipleSelection: true });
    await page.locator("button.fr-select.fr-multiselect").click();
    await page.locator(".fr-multiselect__collapse__fieldset label").nth(0).click();
    await page.locator(".fr-multiselect__collapse__fieldset label").nth(1).click();
    const selectedRows = await page.evaluate(
      () => (globalThis as GlobalWithGrist).__gristSelectedRows,
    );
    expect(selectedRows).toEqual([1, 2]);
  });

  test("trigger label shows selected option labels after selection", async ({ page }) => {
    await injectRecords(page, SMALL_LIST, MAPPINGS);
    await injectOptions(page, { enableMultipleSelection: true });
    const trigger = page.locator("button.fr-select.fr-multiselect");
    await trigger.click();
    await page.locator(".fr-multiselect__collapse__fieldset label").nth(0).click();
    await page.locator(".fr-multiselect__collapse__fieldset label").nth(1).click();
    await expect(trigger).toContainText("Alice, Bob");
  });

  test("unchecking an option removes it from setSelectedRows", async ({ page }) => {
    await injectRecords(page, SMALL_LIST, MAPPINGS);
    await injectOptions(page, { enableMultipleSelection: true });
    await page.locator("button.fr-select.fr-multiselect").click();
    await page.locator(".fr-multiselect__collapse__fieldset label").nth(0).click();
    await page.locator(".fr-multiselect__collapse__fieldset label").nth(1).click();
    await page.locator(".fr-multiselect__collapse__fieldset label").nth(0).click();
    const selectedRows = await page.evaluate(
      () => (globalThis as GlobalWithGrist).__gristSelectedRows,
    );
    expect(selectedRows).toEqual([2]);
  });

  // ─── Deselect all ────────────────────────────────────────────────────────────

  test("Tout désélectionner clears setSelectedRows and reverts trigger to placeholder", async ({
    page,
  }) => {
    await injectRecords(page, SMALL_LIST, MAPPINGS);
    await injectOptions(page, { enableMultipleSelection: true });
    await page.locator("button.fr-select.fr-multiselect").click();
    await page.locator('button[name="select-all"]').click();
    await page.locator('button[name="select-all"]').click();
    const selectedRows = await page.evaluate(
      () => (globalThis as GlobalWithGrist).__gristSelectedRows,
    );
    expect(selectedRows).toEqual([]);
    await expect(page.locator("button.fr-select.fr-multiselect")).toContainText(
      "Sélectionner une option",
    );
  });

  // ─── Search ──────────────────────────────────────────────────────────────────

  test("search filters options to matching items only", async ({ page }) => {
    await injectRecords(page, LARGE_LIST, MAPPINGS);
    await page.locator("button.fr-select.fr-multiselect").click();
    await page.locator('input[type="text"]').fill("spéciale");
    await expect(page.locator('input[type="checkbox"]')).toHaveCount(1);
    await expect(page.getByText("Recherche spéciale")).toBeVisible();
  });

  test("clearing search restores all options", async ({ page }) => {
    await injectRecords(page, SMALL_LIST, MAPPINGS);
    await page.locator("button.fr-select.fr-multiselect").click();
    await page.locator('input[type="text"]').fill("Alice");
    await expect(page.locator('input[type="checkbox"]')).toHaveCount(1);
    await page.locator('input[type="text"]').clear();
    await expect(page.locator('input[type="checkbox"]')).toHaveCount(3);
  });

  // ─── Config panel ─────────────────────────────────────────────────────────────

  test("onEditOptions opens the config panel", async ({ page }) => {
    await injectRecords(page, SMALL_LIST, MAPPINGS);
    await page.evaluate(() => {
      (globalThis as GlobalWithGrist).__gristOnEditOptions();
    });
    await expect(page.getByText("Configuration du widget")).toBeVisible();
  });

  test("config panel is prefilled with current label, description, placeholder", async ({
    page,
  }) => {
    await injectRecords(page, SMALL_LIST, MAPPINGS);
    await page.evaluate(
      (opts) => {
        (globalThis as GlobalWithGrist).__gristOnOptions(opts);
        (globalThis as GlobalWithGrist).__gristOnEditOptions();
      },
      { label: "Mon libellé", description: "Ma description", placeholder: "Mon placeholder" },
    );
    await expect(page.getByLabel("Libellé")).toHaveValue("Mon libellé");
    await expect(page.getByLabel("Description")).toHaveValue("Ma description");
    await expect(page.getByLabel("Placeholder", { exact: true })).toHaveValue("Mon placeholder");
  });

  test("saving the config updates the label displayed above the dropdown", async ({ page }) => {
    await injectRecords(page, SMALL_LIST, MAPPINGS);
    await page.evaluate(() => {
      (globalThis as GlobalWithGrist).__gristOnEditOptions();
    });
    await page.getByLabel("Libellé").fill("Nouveau libellé");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.locator(".fr-label").first()).toContainText("Nouveau libellé");
  });

  test("saving the config updates the placeholder in the trigger", async ({ page }) => {
    await injectRecords(page, SMALL_LIST, MAPPINGS);
    await page.evaluate(() => {
      (globalThis as GlobalWithGrist).__gristOnEditOptions();
    });
    await page.getByLabel("Placeholder", { exact: true }).fill("Choisir…");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.locator("button.fr-select.fr-multiselect")).toContainText("Choisir…");
  });

  test("cancel closes the config panel without saving", async ({ page }) => {
    await injectRecords(page, SMALL_LIST, MAPPINGS);
    await page.evaluate(() => {
      (globalThis as GlobalWithGrist).__gristOnEditOptions();
    });
    await page.getByLabel("Libellé").fill("Ne pas enregistrer");
    await page.getByRole("button", { name: "Annuler" }).click();
    await expect(page.getByText("Configuration du widget")).not.toBeVisible();
    await expect(page.locator("button.fr-select.fr-multiselect")).toBeVisible();
  });

  // ─── Multiple selection toggle ────────────────────────────────────────────────

  test("config panel shows Activer la sélection multiple checkbox unchecked by default", async ({
    page,
  }) => {
    await injectRecords(page, SMALL_LIST, MAPPINGS);
    await page.evaluate(() => {
      (globalThis as GlobalWithGrist).__gristOnEditOptions();
    });
    await expect(page.locator('label[for="enable-multiple-selection"]')).toBeVisible();
    await expect(page.locator("#enable-multiple-selection")).not.toBeChecked();
  });

  test("single selection mode shows checkboxes (one-at-a-time behaviour)", async ({ page }) => {
    await injectRecords(page, SMALL_LIST, MAPPINGS);
    await page.locator("button.fr-select.fr-multiselect").click();
    await expect(page.locator('input[type="checkbox"]').first()).toBeAttached();
  });

  test("in single selection mode, the dropdown closes immediately after selection", async ({
    page,
  }) => {
    await injectRecords(page, SMALL_LIST, MAPPINGS);
    await page.locator("button.fr-select.fr-multiselect").click();
    await page.locator(".fr-multiselect__collapse__fieldset label").nth(0).click();
    await expect(page.locator(".fr-multiselect__collapse")).not.toBeVisible();
  });

  test("enabling multiple selection shows checkboxes", async ({ page }) => {
    await injectRecords(page, SMALL_LIST, MAPPINGS);
    await injectOptions(page, { enableMultipleSelection: true });
    await page.locator("button.fr-select.fr-multiselect").click();
    await expect(page.locator('input[type="checkbox"]').first()).toBeAttached();
  });

  test("enabling multiple selection allows accumulating selections", async ({ page }) => {
    await injectRecords(page, SMALL_LIST, MAPPINGS);
    await injectOptions(page, { enableMultipleSelection: true });
    await page.locator("button.fr-select.fr-multiselect").click();
    await page.locator(".fr-multiselect__collapse__fieldset label").nth(0).click();
    await page.locator(".fr-multiselect__collapse__fieldset label").nth(1).click();
    const selectedRows = await page.evaluate(
      () => (globalThis as GlobalWithGrist).__gristSelectedRows,
    );
    expect(selectedRows).toEqual([1, 2]);
    await expect(page.locator("button.fr-select.fr-multiselect")).toContainText("Alice, Bob");
  });

  test("saving the config with multiple selection enabled persists the option", async ({
    page,
  }) => {
    await injectRecords(page, SMALL_LIST, MAPPINGS);
    await page.evaluate(() => {
      (globalThis as GlobalWithGrist).__gristOnEditOptions();
    });
    await page.locator('label[for="enable-multiple-selection"]').click();
    await page.getByRole("button", { name: "Enregistrer" }).click();
    const storedOptions = await page.evaluate(
      () => (globalThis as { __gristStoredOptions?: Record<string, unknown> }).__gristStoredOptions,
    );
    expect(storedOptions?.enableMultipleSelection).toBe(true);
  });
});
