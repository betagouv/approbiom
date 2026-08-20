import type {
    ProgrammeAidePort,
    ProgrammeAideUpdateData,
} from '@shared/core/application/ports/programme-aide'
import type { ProgrammeAide } from '@shared/core/domain/entities/programme-aide'
import { gristReady } from '../grist-ready'
import {
    asNumber,
    asString,
    fetchRowsOnce,
    updateRow,
    type GristCells,
    type GristRow,
} from '../grist-helpers'
import { COLUMNS, TABLE, type ProgrammeAideColumn } from '../grist-tables'

const MAPPING_COLUMNS_PROGRAMME_AIDE = {
    laureat: 'Laureat',
} as const satisfies Partial<Record<keyof ProgrammeAide, ProgrammeAideColumn>>

function mapFromGristToApplication(row: GristRow): ProgrammeAide {
    return {
        id: asNumber(row.id) ?? 0,
        year: asNumber(row.Annee) ?? 0,
        name: asString(row.Nom_complet),
        shortName: asString(row.Nom_raccourci),
        appelAProjet: asString(row.Appel_a_projet),
        // `Laureat` is a Ref to the plan the programme named lauréat. An empty
        // Ref reads as 0, which is no plan at all rather than the plan of
        // rowId 0.
        laureat: asNumber(row.Laureat) || null,
    }
}

/**
 * The cells one update writes. No plan named lauréat empties the Ref, and an
 * empty Ref is written as 0 — Grist has no other way to say « personne ».
 */
function mapFromApplicationToGrist(
    updateData: ProgrammeAideUpdateData
): GristCells {
    const cells: GristCells = {}

    if (updateData.laureat !== undefined)
        cells[MAPPING_COLUMNS_PROGRAMME_AIDE.laureat] = updateData.laureat ?? 0

    return cells
}

export function createGristProgrammeAidePort(): ProgrammeAidePort {
    return {
        async list() {
            await gristReady()

            const rows = await fetchRowsOnce(
                TABLE.programmeAide,
                COLUMNS.programmeAide
            )

            return rows.map(mapFromGristToApplication)
        },
        async update(programmeAideId, updateData) {
            await gristReady()

            const updatedProgrammeAide = await updateRow(
                TABLE.programmeAide,
                programmeAideId,
                mapFromApplicationToGrist(updateData)
            )

            return mapFromGristToApplication(updatedProgrammeAide)
        },
    }
}
