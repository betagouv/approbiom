import type { CellValue } from 'grist/GristData'

export type GristRow = Record<string, unknown>

export type GristCells = Record<string, CellValue>

export type ColumnMajorTable = Record<string, unknown[]>

/**
 * Pivots Grist's column-major table (one array per column) into one plain object
 * per row. Every column present in `columns` lands in every row, so filter the
 * columns upstream (see `fetchRows`) to keep only the ones you want.
 */
export function toRows(columns: ColumnMajorTable): GristRow[] {
    const colIds = Object.keys(columns)

    const rowCount = colIds.length === 0 ? 0 : columns[colIds[0]].length

    return Array.from({ length: rowCount }, (_, index) =>
        Object.fromEntries(
            colIds.map((colId) => [colId, columns[colId][index]])
        )
    )
}

/**
 * Fetches a Grist table and returns it row by row, keeping only the requested
 * columns.
 *
 * @param tableId   ID of the Grist table to fetch.
 * @param columnIds Columns to keep. When omitted, every column is returned and
 *                  nothing is validated.
 * @throws If a requested column is absent from the fetched table.
 *
 * @remark The Grist Plugin API (`grist.docApi.fetchTable`) always returns every
 * column of the table and offers no way to request a subset, so we filter here,
 * before pivoting. This is also the only place we can catch schema drift: the
 * generated types are erased at build time, so if a requested column has been
 * renamed or removed in the document we throw instead of silently returning rows
 * with a missing key. Columns we did not ask for are ignored, whatever happened
 * to them.
 */
export async function fetchRows(
    tableId: string,
    columnIds?: readonly string[]
): Promise<GristRow[]> {
    let columns: ColumnMajorTable
    try {
        columns = (await grist.docApi.fetchTable(tableId)) as ColumnMajorTable
    } catch (cause) {
        throw new Error(
            `Grist table "${tableId}" could not be read — check it still exists in the document. `,
            { cause }
        )
    }

    if (!columnIds || columnIds.length === 0) {
        return toRows(columns)
    }

    const missing = columnIds.filter((colId) => !(colId in columns))
    if (missing.length > 0) {
        throw new Error(
            `Grist table "${tableId}" is missing requested column(s): ${missing.join(', ')}. `
        )
    }

    const selectedColumns: ColumnMajorTable = Object.fromEntries(
        columnIds.map((colId) => [colId, columns[colId]])
    )
    return toRows(selectedColumns)
}

const inFlight = new Map<string, Promise<GristRow[]>>()

/**
 * `fetchRows`, minus the reads a single load duplicates.
 */
export function fetchRowsOnce(
    tableId: string,
    columnIds: readonly string[]
): Promise<GristRow[]> {
    const key = `${tableId}(${columnIds.join(',')})`

    const pending = inFlight.get(key)
    if (pending) return pending

    const reading = fetchRows(tableId, columnIds).finally(() => {
        inFlight.delete(key)
    })
    inFlight.set(key, reading)

    return reading
}

/**
 * @remark The Grist Plugin API offers no way to read a single record, so we
 * fetch the table and search it here.
 */
export async function fetchRow(
    tableId: string,
    rowId: number
): Promise<GristRow> {
    const rows = await fetchRows(tableId)

    const row = rows.find((row) => row.id === rowId)

    if (!row) {
        throw new Error(
            `Row "${rowId} from table ${tableId} has not been found."`
        )
    }
    return row
}

export async function updateRow(
    tableId: string,
    rowId: number,
    fields: GristCells
): Promise<GristRow> {
    try {
        await grist.getTable(tableId).update({ id: rowId, fields })
        const updatedRow = await fetchRow(tableId, rowId)
        return updatedRow
    } catch (cause) {
        throw new Error(
            `Grist row ${rowId} of table "${tableId}" could not be updated — check the row and the column(s) ${Object.keys(fields).join(', ')} still exist in the document. `,
            { cause }
        )
    }
}

export const asString = (value: unknown): string =>
    typeof value === 'string' ? value : ''

export const asNumber = (value: unknown): number | undefined =>
    typeof value === 'number' ? value : undefined

/** Grist carries a Date as seconds since the epoch; an unset cell is null. */
export const asDate = (value: unknown): Date | null =>
    typeof value === 'number' ? new Date(value * 1000) : null

/** A Grist toggle reads as a boolean, but an untouched cell can be 1, 0 or null. */
export const asBoolean = (value: unknown): boolean =>
    value === true || value === 1

/**
 * A cell holding several rowIds — a Reference List, an Attachments column —
 * arrives as the list marker followed by the ids. An empty cell is null rather
 * than an empty list, and reads here as no id at all.
 */
export const asIdList = (value: unknown): number[] =>
    Array.isArray(value) && value[0] === 'L'
        ? value.slice(1).filter((id): id is number => typeof id === 'number')
        : []

export function lookup<T>(index: Map<number, T>, id: unknown): T | undefined {
    return typeof id === 'number' && id !== 0 ? index.get(id) : undefined
}

export function indexByKey<T>(
    rows: readonly T[],
    keyOf: (row: T) => number | null
): Map<number, T> {
    const index = new Map<number, T>()
    for (const row of rows) {
        const key = keyOf(row)
        if (key !== null) index.set(key, row)
    }
    return index
}

export function byRowId(rows: readonly GristRow[]): Map<number, GristRow> {
    return indexByKey(rows, (row) => asNumber(row.id) ?? null)
}

/** Indexes rows by a text column */
export function byColumn(
    rows: readonly GristRow[],
    column: string
): Map<string, GristRow> {
    const index = new Map<string, GristRow>()
    for (const row of rows) {
        const key = asString(row[column])
        if (key !== '') index.set(key, row)
    }
    return index
}
