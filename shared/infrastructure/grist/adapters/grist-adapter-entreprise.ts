import type { EntreprisePort } from '@shared/core/application/ports/entreprise'
import { gristReady } from '../helpers/grist-ready'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import {
    asString,
    createRows,
    fetchRowsOnce,
    type GristRow,
} from '../helpers/grist-helpers'
import { COLUMNS, TABLE } from '../types/grist-tables'

export function toEntreprise(row: GristRow): Entreprise {
    return {
        // Stored numeric, but it identifies an entreprise rather than
        // measuring anything, so it crosses as the string it is.
        siret:
            typeof row.Siret === 'number'
                ? String(row.Siret)
                : asString(row.Siret),
        denomination: asString(row.Denomination),
    }
}

export function createGristEntreprisePort(): EntreprisePort {
    return {
        async list() {
            await gristReady()

            const rows = await fetchRowsOnce(
                TABLE.entreprise,
                COLUMNS.entreprise
            )

            return rows.map(toEntreprise)
        },

        async create({ siret, denomination }) {
            await gristReady()

            await createRows(TABLE.entreprise, [
                { Siret: Number(siret), Denomination: denomination },
            ])
        },
    }
}
