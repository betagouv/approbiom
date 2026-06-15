import { test, expect } from "../fixtures";
import { Page } from "@playwright/test";

const WIDGET_URL = "grist-widget/selecteur-multiple-editeur/";

type GlobalWithGrist = typeof globalThis & {
  __gristOnOptions: (options: unknown) => void;
  __gristOnRecord: (record: unknown) => void;
  __gristSelectedTableId: string;
  __gristColumnLabels: Record<string, string>;
  __gristColumnTypes: Record<string, string>;
  __gristFetchTableData: Record<string, Record<string, unknown[]>>;
  __gristUpdatedRecord: { id: number; fields: Record<string, unknown> };
};

async function injectOptions(page: Page, opts: unknown) {
  await page.evaluate((o) => {
    (globalThis as GlobalWithGrist).__gristOnOptions(o);
  }, opts);
}

async function injectRecord(page: Page, record: unknown) {
  await page.evaluate((r) => {
    (globalThis as GlobalWithGrist).__gristOnRecord(r);
  }, record);
}

async function setupRefListTable(page: Page) {
  await page.evaluate(() => {
    const g = globalThis as GlobalWithGrist;
    g.__gristSelectedTableId = "MaTable";
    g.__gristColumnLabels = { Contacts: "Contacts" };
    g.__gristColumnTypes = { Contacts: "RefList:Personnes" };
    g.__gristFetchTableData = { Personnes: { id: [1, 2, 3], nom: ["Alice", "Bob", "Charlie"] } };
  });
}

test.describe("Sélecteur multiple éditeur — RefList column override", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(WIDGET_URL);
  });

  test("shows info alert when no column is configured", async ({ page }) => {
    await injectOptions(page, {});
    await expect(page.locator(".fr-alert--info")).toBeVisible();
  });

  test("shows multiselect populated with referenced table rows once configured", async ({
    page,
  }) => {
    await setupRefListTable(page);
    await injectOptions(page, { refColumnId: "Contacts", displayColumnId: "nom" });
    await injectRecord(page, { id: 7, Contacts: ["L", 1, 3] });

    // The dropdown is collapsed by default — open it first
    await page.locator("button.fr-select").click();

    await expect(page.getByRole("checkbox", { name: "Alice" })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "Bob" })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "Charlie" })).toBeVisible();
  });

  test("selecting a value calls selectedTable.update with RefList encoding", async ({ page }) => {
    await setupRefListTable(page);
    await injectOptions(page, { refColumnId: "Contacts", displayColumnId: "nom" });
    await injectRecord(page, { id: 7, Contacts: ["L", 1] });

    // Open the dropdown, then click "Bob" label to toggle the checkbox
    await page.locator("button.fr-select").click();
    await page.locator("label", { hasText: "Bob" }).click();

    const updated = await page.evaluate(
      () => (globalThis as GlobalWithGrist).__gristUpdatedRecord,
    );
    expect(updated.id).toBe(7);
    expect(updated.fields["Contacts"]).toEqual(["L", 1, 2]);
  });
});
