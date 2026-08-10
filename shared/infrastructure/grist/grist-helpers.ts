import { indexByKey } from '@shared/grist/api/client'

export type GristRow = Record<string, unknown>

export const asString = (value: unknown): string =>
    typeof value === 'string' ? value : ''

export const asNumber = (value: unknown): number | undefined =>
    typeof value === 'number' ? value : undefined

export function lookup<T>(index: Map<number, T>, id: unknown): T | undefined {
    return typeof id === 'number' && id !== 0 ? index.get(id) : undefined
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
