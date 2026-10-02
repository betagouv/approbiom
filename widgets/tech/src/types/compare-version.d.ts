/**
 * The types related to the compare document versions Grist API endpoint.
 * @see https://support.getgrist.com/api/#tag/docs/operation/compareVersions
 */

/** `[before, after]`, each wrapped in a one-item array, `null` when absent and `'?'` when unknown. */
export type CellDelta = [unknown[] | null | '?', unknown[] | null | '?']

export interface TableDelta {
    addRows: number[]
    columnDeltas: Record<string, Record<string, CellDelta> | undefined>
}
export type TableDeltas = Record<string, TableDelta | undefined>

export interface ResultCompareVersion {
    details?: {
        rightChanges?: {
            tableDeltas?: TableDeltas
        }
    }
}
