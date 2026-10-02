/**
 * The types related to the compare document versions Grist API endpoint.
 * @see https://support.getgrist.com/api/#tag/docs/operation/compareVersions
 */

/** `[before, after]`, each wrapped in a one-item array, `null` when absent and `'?'` when unknown. */
export type CellDelta = [unknown[] | null | '?', unknown[] | null | '?']

/** `[before, after]` names; `[null, name]` is an addition and `[name, null]` a removal. */
export type NameChange = [string | null, string | null]

export interface TableDelta {
    addRows: number[]
    updateRows?: number[]
    removeRows?: number[]
    columnRenames?: NameChange[]
    columnDeltas: Record<string, Record<string, CellDelta> | undefined>
}
export type TableDeltas = Record<string, TableDelta | undefined>

/** The changes on one side of a comparison, relative to the common parent. */
export interface ActionSummary {
    tableRenames?: NameChange[]
    tableDeltas?: TableDeltas
}

export interface ColInfo {
    type: string
    isFormula: boolean
    formula: string
    /** JSON, such as `{"choices": [...]}` for a Choice column. */
    widgetOptions: string
    description: string
    /** Refs of the columns whose change recalculates a trigger formula, `null` when there are none. */
    recalcDeps: number[] | null
}

export interface ResultCompareVersion {
    details?: {
        rightChanges?: ActionSummary
    }
}
