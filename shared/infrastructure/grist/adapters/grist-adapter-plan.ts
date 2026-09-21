import type { PlanPort } from '@shared/core/application/ports/plan-d-approvisionnement'
import { isUsageType } from '@shared/core/domain/value-objects/usage'
import { gristReady } from '../helpers/grist-ready'
import { COLUMNS, TABLE } from '../types/grist-tables'
import { asNumber, asString, fetchRowsOnce } from '../helpers/grist-helpers'

export function createGristPlanPort(): PlanPort {
    return {
        async list() {
            await gristReady()

            const rows = await fetchRowsOnce(TABLE.plan, COLUMNS.plan)

            return rows.map((row) => ({
                id: asNumber(row.id) ?? 0,
                nom: asString(row.Nom),
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
