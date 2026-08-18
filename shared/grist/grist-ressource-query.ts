import type { RessourceQuery } from '@shared/core/application/ports/ressource-query'
import { gristReady } from './grist-ready'
import { asString, fetchRowsOnce } from './grist-helpers'
import { COLUMNS, TABLE } from './grist-tables'

export function createGristRessourceQuery(): RessourceQuery {
    return {
        async list() {
            await gristReady()

            const rows = await fetchRowsOnce(
                TABLE.metaRessource,
                COLUMNS.metaRessource
            )

            return rows.map((row) => ({
                code: asString(row.Code_ressource_Approbiom),
                title: asString(row.Description_courte),
            }))
        },
    }
}
