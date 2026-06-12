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
  return columns.filter((col) => isRefType(col.type));
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
