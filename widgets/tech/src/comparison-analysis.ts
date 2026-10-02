import type {
    CellDelta,
    ColInfo,
    TableDelta,
    TableDeltas,
} from './types/compare-version'

export interface AddedColumn {
    colId: string
    type: string
}

export interface AddedTable {
    tableId: string
    label: string
    columns: AddedColumn[]
}

function valueAfter(delta: TableDelta, column: string, rowId: number): unknown {
    const after = delta.columnDeltas[column]?.[rowId]?.[1]
    return Array.isArray(after) ? after[0] : undefined
}

export function findAddedTablesFromTableDeltas(
    tableDeltas: TableDeltas
): AddedTable[] {
    const tables = tableDeltas._grist_Tables
    const sections = tableDeltas._grist_Views_section
    const columns = tableDeltas._grist_Tables_column
    if (!tables) return []

    // find added table refs
    const addedTableRefs = tables.addRows

    if (addedTableRefs.length === 0) {
        return []
    }

    return addedTableRefs.map((tableRef) => {
        // find added table id and label
        const tableId = String(valueAfter(tables, 'tableId', tableRef))
        // Grist shows the title of the table's raw data section, or its tableId when that title is empty.
        const rawSectionRef = valueAfter(tables, 'rawViewSectionRef', tableRef)
        const title =
            sections && typeof rawSectionRef === 'number'
                ? valueAfter(sections, 'title', rawSectionRef)
                : undefined
        const label = typeof title === 'string' && title ? title : tableId

        // find added table columns
        const addedColumns = (columns?.addRows ?? [])
            .filter(
                (columnRef) =>
                    valueAfter(columns!, 'parentId', columnRef) === tableRef
            )
            .map((columnRef) => ({
                colId: String(valueAfter(columns!, 'colId', columnRef)),
                type: String(valueAfter(columns!, 'type', columnRef)),
            }))

        return { tableId, label, columns: addedColumns }
    })
}

export interface AddedColumnInfo {
    colId: string
    colInfo: ColInfo
    label: string
}

export function findAddedColumnInTables(
    tableDeltas: TableDeltas
): Map<string, AddedColumnInfo[]> {
    const tables = tableDeltas._grist_Tables
    const columns = tableDeltas._grist_Tables_column
    const addedColumnsByTableId = new Map<string, AddedColumnInfo[]>()
    if (!columns) return addedColumnsByTableId

    // find all added column refs
    const addedColumnRefs = columns.addRows

    for (const columnRef of addedColumnRefs) {
        // find their infos in columnDeltas
        const colId = String(valueAfter(columns, 'colId', columnRef))
        const formula = valueAfter(columns, 'formula', columnRef)
        const widgetOptions = valueAfter(columns, 'widgetOptions', columnRef)
        const description = valueAfter(columns, 'description', columnRef)
        const recalcDeps = valueAfter(columns, 'recalcDeps', columnRef)
        const addedColumn: AddedColumnInfo = {
            colId,
            colInfo: {
                type: String(valueAfter(columns, 'type', columnRef)),
                isFormula: valueAfter(columns, 'isFormula', columnRef) === true,
                formula: typeof formula === 'string' ? formula : '',
                widgetOptions:
                    typeof widgetOptions === 'string' ? widgetOptions : '',
                description: typeof description === 'string' ? description : '',
                // A reference list is encoded as ["L", ...refs].
                recalcDeps: Array.isArray(recalcDeps)
                    ? recalcDeps.slice(1).map(Number)
                    : null,
            },
            label: String(valueAfter(columns, 'label', columnRef)),
        }

        // link them to their tableId
        // _grist_Tables only names the tables added in the same period. An
        // existing table lists its added columns in its columnRenames instead.
        const tableRef = valueAfter(columns, 'parentId', columnRef)
        const addedTableId =
            tables && typeof tableRef === 'number'
                ? valueAfter(tables, 'tableId', tableRef)
                : undefined
        const tableId =
            typeof addedTableId === 'string'
                ? addedTableId
                : (Object.entries(tableDeltas).find(([, delta]) =>
                      delta?.columnRenames?.some(
                          ([before, after]) =>
                              before === null && after === colId
                      )
                  )?.[0] ?? `parentId ${String(tableRef)}`)

        addedColumnsByTableId.set(tableId, [
            ...(addedColumnsByTableId.get(tableId) ?? []),
            addedColumn,
        ])
    }

    return addedColumnsByTableId
}

/** The value of a cell on one side of a CellDelta, unwrapped from its one-item array. */
type CellValue = unknown

export interface ColumnChange {
    property: string
    before: CellValue
    after: CellValue
}

export interface UpdatedColumnInfo {
    colRef: number
    /** Known only when the colId itself changed. */
    colId?: string
    changes: ColumnChange[]
}

/** Grist keeps only the cells that changed, so a column's table is often not in the comparison. */
export const UNKNOWN_TABLE_ID = 'table inconnue'

function unwrap(side: CellDelta[0]): CellValue {
    return Array.isArray(side) ? side[0] : side
}

export function findUpdatedColumnInTables(
    tableDeltas: TableDeltas
): Map<string, UpdatedColumnInfo[]> {
    const tables = tableDeltas._grist_Tables
    const columns = tableDeltas._grist_Tables_column
    const updatedColumnsByTableId = new Map<string, UpdatedColumnInfo[]>()
    if (!columns) return updatedColumnsByTableId

    // find the updated column refs, leaving out the ones added in the same period
    const addedColumnRefs = new Set(columns.addRows)
    const updatedColumnRefs = (columns.updateRows ?? []).filter(
        (columnRef) => !addedColumnRefs.has(columnRef)
    )

    for (const columnRef of updatedColumnRefs) {
        // find their changes in columnDeltas
        const changes = Object.entries(columns.columnDeltas).flatMap(
            ([property, cells]) => {
                const cell = cells?.[columnRef]
                return cell
                    ? [
                          {
                              property,
                              before: unwrap(cell[0]),
                              after: unwrap(cell[1]),
                          },
                      ]
                    : []
            }
        )
        const colId = valueAfter(columns, 'colId', columnRef)
        const updatedColumn: UpdatedColumnInfo = {
            colRef: columnRef,
            colId: typeof colId === 'string' ? colId : undefined,
            changes,
        }

        // link them to their tableId, when the comparison gives it
        const tableRef = valueAfter(columns, 'parentId', columnRef)
        const tableId =
            tables && typeof tableRef === 'number'
                ? valueAfter(tables, 'tableId', tableRef)
                : undefined
        const key = typeof tableId === 'string' ? tableId : UNKNOWN_TABLE_ID

        updatedColumnsByTableId.set(key, [
            ...(updatedColumnsByTableId.get(key) ?? []),
            updatedColumn,
        ])
    }

    return updatedColumnsByTableId
}
