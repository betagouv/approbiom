export type ColumnMajorTable = Record<string, unknown[]>

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

/**
 * Pivots Grist's column-major table (one array per column) into one plain object
 * per row. Every column present in `columns` lands in every row, so filter the
 * columns upstream (see `fetchRows`) to keep only the ones you want.
 */
export function toRows(columns: ColumnMajorTable): Record<string, unknown>[] {
    const colIds = Object.keys(columns)

    const rowCount = colIds.length === 0 ? 0 : columns[colIds[0]].length

    return Array.from({ length: rowCount }, (_, index) =>
        Object.fromEntries(
            colIds.map((colId) => [colId, columns[colId][index]])
        )
    )
}

export type AttachmentUrlBuilder = (attachmentId: number) => string

export async function getAttachmentUrlBuilder(): Promise<AttachmentUrlBuilder> {
    const { baseUrl, token } = await grist.docApi.getAccessToken({
        readOnly: true,
    })

    return (attachmentId) =>
        `${baseUrl}/attachments/${attachmentId}/download?auth=${encodeURIComponent(token)}`
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
): Promise<Record<string, unknown>[]> {
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
