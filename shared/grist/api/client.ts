type ColumnMajorTable = Record<string, unknown[]>

function toRows(columns: ColumnMajorTable): Record<string, unknown>[] {
    const colIds = Object.keys(columns)
    const ids = columns.id ?? []
    return ids.map((_, index) =>
        Object.fromEntries(
            colIds.map((colId) => [colId, columns[colId][index]])
        )
    )
}

export async function fetchRows(
    tableId: string
): Promise<Record<string, unknown>[]> {
    const columns = (await grist.docApi.fetchTable(tableId)) as ColumnMajorTable
    return toRows(columns)
}
