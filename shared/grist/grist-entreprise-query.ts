import type { EntrepriseQuery } from '@shared/core/application/ports/entreprise-query'
import { gristReady } from './grist-ready'
import { asString, fetchRowsOnce } from './grist-helpers'
import { COLUMNS, TABLE } from './grist-tables'

export function createGristEntrepriseQuery(): EntrepriseQuery {
    return {
        async list() {
            await gristReady()

            const rows = await fetchRowsOnce(
                TABLE.entreprise,
                COLUMNS.entreprise
            )

            return rows.map((row) => ({
                // Stored numeric, but it identifies an entreprise rather than
                // measuring anything, so it crosses as the string it is.
                siret:
                    typeof row.Siret === 'number'
                        ? String(row.Siret)
                        : asString(row.Siret),
                denomination: asString(row.Denomination),
            }))
        },
    }
}
