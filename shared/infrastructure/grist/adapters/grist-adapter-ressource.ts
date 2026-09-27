import type { RessourcePort } from '@shared/core/application/ports/ressource'
import { gristReady } from '../helpers/grist-ready'
import { asString, fetchRowsOnce } from '../helpers/grist-helpers'
import { COLUMNS, TABLE } from '../types/grist-tables'

export function createGristRessourcePort(): RessourcePort {
    return {
        async list() {
            await gristReady()

            const rows = await fetchRowsOnce(
                TABLE.metaRessource,
                COLUMNS.metaRessource
            )

            return rows.map((row) => ({
                code: asString(row.Code_ressource_Approbiom),
                ademeCode: asString(row.ademe_2017),
                title: asString(row.Description_courte),
                description: asString(row.Description),
            }))
        },
    }
}
