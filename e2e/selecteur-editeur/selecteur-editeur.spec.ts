import { test, expect } from "../fixtures";
import { Page } from "@playwright/test";

const WIDGET_URL = "grist-widget/selecteur-editeur/";

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

// Sets up a table "MaTable" with a "Contact" Ref column pointing to "Personnes"
async function setupRefTable(page: Page) {
  await page.evaluate(() => {
    const g = globalThis as GlobalWithGrist;
    g.__gristSelectedTableId = "MaTable";
    g.__gristColumnLabels = { Contact: "Contact" };
    g.__gristColumnTypes = { Contact: "Ref:Personnes" };
    g.__gristFetchTableData = { Personnes: { id: [1, 2], nom: ["Alice", "Bob"] } };
  });
}

test.describe("New widget — Ref column override", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(WIDGET_URL);
  });

  test("shows info alert when no column is configured", async ({ page }) => {
    await injectOptions(page, {});
    await expect(page.locator(".fr-alert--info")).toBeVisible();
  });

  test("shows select populated with referenced table rows once configured", async ({ page }) => {
    await setupRefTable(page);
    await injectOptions(page, { refColumnId: "Contact", displayColumnId: "nom" });
    await injectRecord(page, { id: 5, Contact: 1 });

    const select = page.locator("select");
    await expect(select).toBeVisible();
    await expect(select.locator("option", { hasText: "Alice" })).toBeAttached();
    await expect(select.locator("option", { hasText: "Bob" })).toBeAttached();
  });

  test("selecting a value calls selectedTable.update with correct payload", async ({ page }) => {
    await setupRefTable(page);
    await injectOptions(page, { refColumnId: "Contact", displayColumnId: "nom" });
    await injectRecord(page, { id: 5, Contact: 1 });

    await page.locator("select").selectOption({ label: "Bob" });

    const updated = await page.evaluate(
      () => (globalThis as GlobalWithGrist).__gristUpdatedRecord,
    );
    expect(updated).toEqual({ id: 5, fields: { Contact: 2 } });
  });
});
