import type { RessourcePort } from '@shared/core/application/ports/ressource'
import { gristReady } from '../helpers/grist-ready'
import type { Ressource } from '@shared/core/domain/entities/ressource'
import {
    asString,
    fetchRowsOnce,
    type GristRow,
} from '../helpers/grist-helpers'
import { COLUMNS, TABLE } from '../types/grist-tables'

export function toRessource(row: GristRow): Ressource {
    return {
        code: asString(row.Code_ressource_Approbiom),
        ademeCode: asString(row.ademe_2017),
        title: asString(row.Description_courte),
        description: asString(row.Description),
    }
}

export function createGristRessourcePort(): RessourcePort {
    return {
        async list() {
            await gristReady()

            const rows = await fetchRowsOnce(
                TABLE.metaRessource,
                COLUMNS.metaRessource
            )

            return rows.map(toRessource)
        },
    }
}
