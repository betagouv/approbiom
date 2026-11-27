import type {
    ProgrammeAidePort,
    ProgrammeAideUpdateData,
} from '@shared/core/application/ports/programme-aide'
import type { ProgrammeAide } from '@shared/core/domain/entities/programme-aide'
import { gristReady } from '../helpers/grist-ready'
import {
    asDate,
    asNumber,
    asString,
    fetchRowsOnce,
    updateRow,
    type GristCells,
    type GristRow,
} from '../helpers/grist-helpers'
import { COLUMNS, TABLE, type ProgrammeAideColumn } from '../types/grist-tables'

const MAPPING_COLUMNS_PROGRAMME_AIDE = {
    laureat: 'Laureat',
} as const satisfies Partial<Record<keyof ProgrammeAide, ProgrammeAideColumn>>

function mapFromGristToApplication(row: GristRow): ProgrammeAide {
    return {
        id: asNumber(row.id) ?? 0,
        year: asDate(row.Annee)?.getUTCFullYear() ?? 0,
        name: asString(row.Nom_complet),
        shortName: asString(row.Nom_raccourci),
        appelAProjet: asString(row.Appel_a_projet),
        // An empty Ref reads as 0.
        laureat: asNumber(row.Laureat) || null,
    }
}

/** Grist writes an empty Ref as 0. */
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
