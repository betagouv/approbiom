import type { RessourcesPort } from '@shared/core/application/ports/ressources'
import { gristReady } from '../helpers/grist-ready'
import type { Ressource } from '@shared/core/domain/value-objects/ressource'
import {
    asString,
    fetchRowsOnce,
    type GristRow,
} from '../helpers/grist-helpers'
import { TABLE } from '../types/grist-tables'

const COLUMN_BY_PROPERTY = {
    code: 'Code_ressource_Approbiom',
    ademeCode: 'ademe_2017',
    title: 'Description_courte',
    famille: 'Famille_ressource',
    description: 'Description',
} as const satisfies Record<keyof Ressource, string>

export const ressourceColumns = (properties: readonly (keyof Ressource)[]) =>
    properties.map((property) => COLUMN_BY_PROPERTY[property])

export function toRessource<Property extends keyof Ressource>(
    row: GristRow,
    properties: readonly Property[]
): Pick<Ressource, Property> {
    // Every Ressource property is a text column.
    return Object.fromEntries(
        properties.map((property) => [
            property,
            asString(row[COLUMN_BY_PROPERTY[property]]),
        ])
    ) as Pick<Ressource, Property>
}

export function createGristRessourcesPort(): RessourcesPort {
    return {
        async list<Property extends keyof Ressource>(
            properties: readonly Property[]
        ) {
            await gristReady()

            const rows = await fetchRowsOnce(
                TABLE.metaRessource,
                ressourceColumns(properties)
            )

            return rows.map((row) => toRessource(row, properties))
        },
    }
}
