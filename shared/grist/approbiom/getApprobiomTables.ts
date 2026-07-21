import { fetchRows } from '@shared/grist/api/client'
import {
    type ApprobiomTables,
    type TableId,
    APPROBIOM_TABLE_IDS,
    TABLE_COLUMNS,
} from './model'

// A column can be renamed or removed in the Grist document without the widget
// being rebuilt, and the generated types would still promise it exists. Fail
// loudly at load time instead of letting `undefined` spread through the UI.
function assertColumns(
    tableId: TableId,
    rows: Record<string, unknown>[]
): void {
    // Every row is built from the same column list, so the first one is
    // representative. An empty table carries no column information at all.
    const [firstRow] = rows
    if (firstRow === undefined) return

    const missing = Object.keys(TABLE_COLUMNS[tableId]).filter(
        (colId) => !(colId in firstRow)
    )

    if (missing.length > 0) {
        throw new Error(
            `Grist table "${tableId}" is missing expected column(s): ${missing.join(', ')}. ` +
                `Regenerate shared/grist/approbiom/tables.d.ts if the document schema changed.`
        )
    }
}

export async function getApprobiomTables(): Promise<ApprobiomTables> {
    const tables = await Promise.all(
        APPROBIOM_TABLE_IDS.map(async (tableId) => {
            const rows = await fetchRows(tableId)
            assertColumns(tableId, rows)
            return [tableId, rows] as const
        })
    )

    return Object.fromEntries(tables) as ApprobiomTables
}
