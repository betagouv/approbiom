import { test, expect } from "../fixtures";
import { Page } from "@playwright/test";

const WIDGET_URL = "grist-widget/dropdown/";

type GlobalWithGrist = typeof globalThis & {
  __gristOnRecords: (records: unknown[], mappings: unknown) => void;
  __gristOnOptions: (options: unknown) => void;
  __gristOnEditOptions: () => void;
  __gristCursorPos: { rowId?: number };
};

const RECORDS = [
  { id: 1, nom: "Alice" },
  { id: 2, nom: "Bob" },
  { id: 3, nom: "Charlie" },
];

const MAPPINGS = { OptionsToSelect: "nom" };

async function injectRecords(page: Page, records: unknown[], mappings: unknown) {
  await page.evaluate(
    ({ r, m }) => {
      (globalThis as GlobalWithGrist).__gristOnRecords(r, m);
    },
    { r: records, m: mappings },
  );
}

test.describe("Dropdown", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(WIDGET_URL);
  });

  test("shows info alert when no records are provided", async ({ page }) => {
    await injectRecords(page, [], MAPPINGS);
    await expect(page.locator(".fr-alert--info")).toBeVisible();
  });

  test("renders the trigger button with default placeholder when nothing is selected", async ({
    page,
  }) => {
    await injectRecords(page, RECORDS, MAPPINGS);
    const trigger = page.locator("button.fr-select.fr-multiselect");
    await expect(trigger).toBeVisible();
    await expect(trigger).toContainText("Sélectionner une option");
  });

  test("opens the dropdown and shows all options", async ({ page }) => {
    await injectRecords(page, RECORDS, MAPPINGS);
    await page.locator("button.fr-select.fr-multiselect").click();
    await expect(page.locator(".fr-multiselect__collapse")).toBeVisible();
    await expect(page.locator('input[type="checkbox"]')).toHaveCount(3);
  });

  test("selecting an option calls setCursorPos with the matching record id", async ({ page }) => {
    await injectRecords(page, RECORDS, MAPPINGS);
    await page.locator("button.fr-select.fr-multiselect").click();
    await page.locator(".fr-multiselect__collapse__fieldset label").first().click();
    const cursorPos = await page.evaluate(
      () => (globalThis as GlobalWithGrist).__gristCursorPos,
    );
    expect(cursorPos).toEqual({ rowId: 1 });
  });
});
