import type { PlanQuery } from '@shared/application/ports/plan-query'
import { gristReady } from './grist-ready'
import { asNumber, asString, fetchRowsOnce } from './grist-helpers'
import { COLUMNS, TABLE } from './grist-tables'

export function createGristPlanQuery(): PlanQuery {
    return {
        async list() {
            await gristReady()

            const rows = await fetchRowsOnce(TABLE.plan, COLUMNS.plan)

            return rows.map((row) => ({
                id: asNumber(row.id) ?? 0,
                nom: asString(row.Nom),
                // A Ref to `Installation`; where the plan sits is read from the
                // installation's commune, not from here.
                installation: asNumber(row.Installation) ?? 0,
            }))
        },
    }
}
