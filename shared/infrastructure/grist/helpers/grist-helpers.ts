import type { CellValue } from 'grist/GristData'

export type GristRow = Record<string, unknown>

export type GristCells = Record<string, CellValue>

export type ColumnMajorTable = Record<string, unknown[]>

/** Pivots Grist's column-major table (one array per column) into one object per row. */
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
 * `grist.docApi.fetchTable` always returns every column, so we filter here.
 * Throws if a requested column is missing: the only place schema drift can be caught.
 * Without `columnIds`, every column is returned unchecked.
 */
export async function fetchRows(
    tableId: string,
    columnIds?: readonly string[]
): Promise<GristRow[]> {
    return selectRows(tableId, await fetchColumns(tableId), columnIds)
}

async function fetchColumns(tableId: string): Promise<ColumnMajorTable> {
    try {
        return (await grist.docApi.fetchTable(tableId)) as ColumnMajorTable
    } catch (cause) {
        throw new Error(
            `Grist table "${tableId}" could not be read — check it still exists in the document. `,
            { cause }
        )
    }
}

function selectRows(
    tableId: string,
    columns: ColumnMajorTable,
    columnIds?: readonly string[]
): GristRow[] {
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

const inFlight = new Map<string, Promise<ColumnMajorTable>>()

/** `fetchRows` deduplicating concurrent reads of the same table (Grist sends every column anyway). */
export async function fetchRowsOnce(
    tableId: string,
    columnIds: readonly string[]
): Promise<GristRow[]> {
    let reading = inFlight.get(tableId)
    if (!reading) {
        reading = fetchColumns(tableId).finally(() => {
            inFlight.delete(tableId)
        })
        inFlight.set(tableId, reading)
    }

    return selectRows(tableId, await reading, columnIds)
}

/** The Grist Plugin API cannot read a single record: fetch the whole table. */
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

export async function createRows(
    tableId: string,
    rows: readonly GristCells[]
): Promise<number[]> {
    try {
        const records = rows.map((fields) => ({
            fields,
        }))
        const table = grist.getTable(tableId)

        const created = await table.create(records)
        return created.map(({ id }) => id)
    } catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause)

        throw new Error(
            `Grist rows of table "${tableId}" could not be created: ${message}`,
            { cause }
        )
    }
}

export async function deleteRows(
    tableId: string,
    rowIds: readonly number[]
): Promise<void> {
    try {
        await grist.getTable(tableId).destroy([...rowIds])
    } catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause)

        throw new Error(
            `Grist rows ${rowIds.join(', ')} of table "${tableId}" could not be deleted: ${message}`,
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

/** Reference List / Attachments cells arrive as ['L', ...ids]; an empty cell is null. */
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
