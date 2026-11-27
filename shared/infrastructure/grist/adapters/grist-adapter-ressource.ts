import type { RessourcePort } from '@shared/core/application/ports/ressource'
import type { RessourcesPort } from '@shared/core/application/ports/ressources'
import { gristReady } from '../helpers/grist-ready'
import type { Ressource } from '@shared/core/domain/value-objects/ressource'
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
        famille: '',
        description: asString(row.Description),
    }
}

/** @deprecated Gives an empty famille: use `createGristRessourcesPort`. */
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

const COLUMN_BY_PROPERTY = {
    code: 'Code_ressource_Approbiom',
    ademeCode: 'ademe_2017',
    title: 'Description_courte',
    famille: 'Famille_ressource',
    description: 'Description',
} as const satisfies Record<keyof Ressource, string>

export function createGristRessourcesPort(): RessourcesPort {
    return {
        async list<Property extends keyof Ressource>(
            properties: readonly Property[]
        ) {
            await gristReady()

            const rows = await fetchRowsOnce(
                TABLE.metaRessource,
                properties.map((property) => COLUMN_BY_PROPERTY[property])
            )

            // Every Ressource property is a text column.
            return rows.map(
                (row) =>
                    Object.fromEntries(
                        properties.map((property) => [
                            property,
                            asString(row[COLUMN_BY_PROPERTY[property]]),
                        ])
                    ) as Pick<Ressource, Property>
            )
        },
    }
}
