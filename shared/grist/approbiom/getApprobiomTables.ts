import { fetchRows } from '@shared/grist/api/client'
import type { Plan_d_approvisionnement } from './tables'

type TableRowMap = {
    Plan_d_approvisionnement: Plan_d_approvisionnement
}

type TableId = keyof TableRowMap

type ColumnId<K extends TableId> = keyof TableRowMap[K] & string

/**
 * Fetches one Approbiom table, keeping only the requested columns and narrowing
 * the row type to exactly those columns — so a page can ask for a subset instead
 * of the whole row.
 *
 * @example
 * const plans = await getApprobiomTable('Plan_d_approvisionnement', ['Nom', 'Statut'])
 * //    ^? Pick<Plan_d_approvisionnement, 'Nom' | 'Statut'>[]
 *
 * @throws If a requested column is absent from the fetched table (see `fetchRows`).
 */
export async function getApprobiomTable<
    K extends TableId,
    C extends ColumnId<K>,
>(tableId: K, columnIds: readonly C[]): Promise<Pick<TableRowMap[K], C>[]> {
    const rows = await fetchRows(tableId, columnIds)
    return rows as Pick<TableRowMap[K], C>[]
}
