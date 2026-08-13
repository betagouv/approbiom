import type { ProgrammeAideQuery } from '@shared/application/ports/programme-aide-query'
import { gristReady } from './grist-ready'
import { asNumber, asString, fetchRowsOnce } from './grist-helpers'
import { COLUMNS, TABLE } from './grist-tables'

export function createGristProgrammeAideQuery(): ProgrammeAideQuery {
    return {
        async list() {
            await gristReady()

            const rows = await fetchRowsOnce(
                TABLE.programmeAide,
                COLUMNS.programmeAide
            )

            return rows.map((row) => ({
                id: asNumber(row.id) ?? 0,
                year: asNumber(row.Annee) ?? 0,
                name: asString(row.Nom_complet),
                shortName: asString(row.Nom_raccourci),
                appelAProjet: asString(row.Appel_a_projet),
            }))
        },
    }
}
