import type { DemandeSubventionQuery } from '@shared/core/application/ports/demande-subvention-query'
import { gristReady } from './grist-ready'
import { asNumber, fetchRowsOnce } from './grist-helpers'
import { COLUMNS, TABLE } from './grist-tables'

export function createGristDemandeSubventionQuery(): DemandeSubventionQuery {
    return {
        async list() {
            await gristReady()

            const rows = await fetchRowsOnce(
                TABLE.demandeSubvention,
                COLUMNS.demandeSubvention
            )

            return rows.map((row) => ({
                id: asNumber(row.id) ?? 0,
                programmeAide: asNumber(row.Programme_d_aide) ?? 0,
                planDApprovisionnement:
                    asNumber(row.Plan_d_approvisionnement) ?? 0,
            }))
        },
    }
}
