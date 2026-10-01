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
    label: string
    columns: CreatedColumn[]
}

function valueAfter(delta: TableDelta, column: string, rowId: number): unknown {
    const after = delta.columnDeltas[column]?.[rowId]?.[1]
    return Array.isArray(after) ? after[0] : undefined
}

export function findCreatedTablesFromComparison(
    comparison: unknown
): CreatedTable[] {
    const tableDeltas =
        (comparison as ComparisonWithDetails).details?.rightChanges
            ?.tableDeltas ?? {}
    const tables = tableDeltas._grist_Tables
    const sections = tableDeltas._grist_Views_section
    const columns = tableDeltas._grist_Tables_column
    if (!tables) return []

    // find created table refs
    const createdTableRefs = tables.addRows

    if (createdTableRefs.length === 0) {
        return []
    }

    return createdTableRefs.map((tableRef) => {
        // find created table id and label
        const tableId = String(valueAfter(tables, 'tableId', tableRef))
        // Grist shows the title of the table's raw data section, or its tableId when that title is empty.
        const rawSectionRef = valueAfter(tables, 'rawViewSectionRef', tableRef)
        const title =
            sections && typeof rawSectionRef === 'number'
                ? valueAfter(sections, 'title', rawSectionRef)
                : undefined
        const label = typeof title === 'string' && title ? title : tableId

        // find created table columns
        const createdColumns = (columns?.addRows ?? [])
            .filter(
                (columnRef) =>
                    valueAfter(columns!, 'parentId', columnRef) === tableRef
            )
            .map((columnRef) => ({
                colId: String(valueAfter(columns!, 'colId', columnRef)),
                type: String(valueAfter(columns!, 'type', columnRef)),
            }))

        return { tableId, label, columns: createdColumns }
    })
}
