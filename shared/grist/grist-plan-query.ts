import type { PlanQuery } from '@shared/application/ports/plan-query'
import { isUsageType } from '@shared/application/domain/plan-d-approvisionnement'
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
                typeDePlan: asString(row.Type_de_plan),
                usage: isUsageType(row.Usage_principal)
                    ? row.Usage_principal
                    : null,
                natureDonnee: asString(row.Nature_Donnee),
                statut: asString(row.Statut),
            }))
        },
    }
}
