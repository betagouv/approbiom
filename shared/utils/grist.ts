import type { CellValue } from "grist/GristData";

interface GristTablesData {
  id: number[];
  tableId: string[];
}

interface GristColumnsData {
  parentId: number[];
  colId: string[];
  label: string[];
  type: string[];
  widgetOptions: string[];
}

export interface ColumnInfo {
  colId: string;
  label: string;
  type: string;
}

export async function fetchAllTables(): Promise<GristTablesData> {
  return grist.docApi.fetchTable("_grist_Tables") as Promise<GristTablesData>;
}

export async function fetchAllColumns(): Promise<GristColumnsData> {
  return grist.docApi.fetchTable("_grist_Tables_column") as Promise<GristColumnsData>;
}

export function getTableNumericalId(tables: GristTablesData, tableId: string): number {
  const index = tables.tableId.indexOf(tableId);
  if (index === -1) throw new Error(`Table "${tableId}" not found`);
  return tables.id[index]!;
}

export function getColumnsFromTable(
  allColumns: GristColumnsData,
  tableNumericalId: number,
): ColumnInfo[] {
  const result: ColumnInfo[] = [];
  for (let i = 0; i < allColumns.parentId.length; i++) {
    if (allColumns.parentId[i] !== tableNumericalId) continue;
    result.push({
      colId: allColumns.colId[i]!,
      label: allColumns.label[i]!,
      type: allColumns.type[i]!,
    });
  }
  return result;
}

export function isRefType(type: string): boolean {
  return type.startsWith("Ref:") || type.startsWith("RefList:");
}

export function getRefTableId(type: string): string {
  return type.split(":")[1] ?? "";
}

export function getRefColumns(columns: ColumnInfo[]): ColumnInfo[] {
  return columns.filter((col) => col.type.startsWith("Ref:"));
}

export function getRefListColumns(columns: ColumnInfo[]): ColumnInfo[] {
  return columns.filter((col) => col.type.startsWith("RefList:"));
}

/**
 * Grist encodes RefList cell values as ["L", id1, id2, ...].
 * This extracts the row IDs as a plain number array, or returns [] if the cell is empty.
 */
export function decodeRefList(value: unknown): number[] {
  if (!Array.isArray(value) || value[0] !== "L") return [];
  return (value as unknown[]).slice(1).filter((v): v is number => typeof v === "number");
}

/**
 * Encodes a plain number array back into the Grist RefList wire format ["L", id1, id2, ...].
 * Returns null for an empty selection (Grist treats null as "no value").
 * The cast is required because TypeScript cannot infer that "L" satisfies GristObjCode.
 */
export function encodeRefList(ids: number[]): CellValue {
  return (ids.length > 0 ? ["L", ...ids] : null) as CellValue;
}

/** Same as buildSelectOptions but returns { id, label } for DsfrMultiselect. */
export function buildMultiselectOptions(
  rows: Record<string, unknown[]>,
  displayColId: string,
): { id: number; label: string }[] {
  const ids = rows["id"] as number[];
  const labels = rows[displayColId] as unknown[];
  return ids.map((id, i) => ({ id, label: String(labels[i] ?? id) }));
}

export async function fetchTableRows(tableId: string): Promise<Record<string, unknown[]>> {
  return grist.docApi.fetchTable(tableId) as Promise<Record<string, unknown[]>>;
}

/**
 * Returns the first column key that is not an internal Grist column.
 * Grist adds "id", "manualSort", and "gristHelper_*" to every table automatically —
 * they are not user-defined columns. This function skips them to find a meaningful
 * column to use as a display label.
 */
export function getFirstDataColId(rows: Record<string, unknown[]>): string | null {
  const skip = new Set(["id", "manualSort"]);
  return Object.keys(rows).find((k) => !skip.has(k) && !k.startsWith("gristHelper_")) ?? null;
}

/**
 * Converts a Grist table (columnar format) into an array of select options.
 *
 * Grist returns table data as parallel arrays — rows.id[i] and rows[col][i] always
 * correspond to the same row. This function zips them into { value, text } pairs
 * suitable for a <select> element, where value is the row ID and text is the display label.
 */
export function buildSelectOptions(
  rows: Record<string, unknown[]>,
  displayColId: string,
): { value: number; text: string }[] {
  const ids = rows["id"] as number[];
  const labels = rows[displayColId] as unknown[];
  return ids.map((id, i) => ({ value: id, text: String(labels[i] ?? id) }));
}
