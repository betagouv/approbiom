/** `[before, after]`, each wrapped in a one-item array, `null` when absent and `'?'` when unknown. */
type CellDelta = [unknown[] | null | '?', unknown[] | null | '?']

interface TableDelta {
    addRows: number[]
    columnDeltas: Record<string, Record<string, CellDelta> | undefined>
}

interface ComparisonWithDetails {
    details?: {
        rightChanges?: {
            tableDeltas?: Record<string, TableDelta | undefined>
        }
    }
}

export interface CreatedColumn {
    colId: string
    type: string
}

export interface CreatedTable {
    tableId: string
    columns: CreatedColumn[]
}

function valueAfter(delta: TableDelta, column: string, rowId: number): unknown {
    const after = delta.columnDeltas[column]?.[rowId]?.[1]
    return Array.isArray(after) ? after[0] : undefined
}

export function findCreatedTables(comparison: unknown): CreatedTable[] {
    const tableDeltas = (comparison as ComparisonWithDetails).details
        ?.rightChanges?.tableDeltas
    const tables = tableDeltas?._grist_Tables
    if (!tables) return []
    const columns = tableDeltas._grist_Tables_column

    return tables.addRows.map((tableRef) => ({
        tableId: String(valueAfter(tables, 'tableId', tableRef)),
        columns: (columns?.addRows ?? [])
            .filter(
                (columnRef) =>
                    valueAfter(columns!, 'parentId', columnRef) === tableRef
            )
            .map((columnRef) => ({
                colId: String(valueAfter(columns!, 'colId', columnRef)),
                type: String(valueAfter(columns!, 'type', columnRef)),
            })),
    }))
}
