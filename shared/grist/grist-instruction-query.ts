import type { InstructionQuery } from '@shared/core/application/ports/instruction'
import { isAvisCRB } from '@shared/core/domain/value-objects/avis-crb'
import { isAvisPrefet } from '@shared/core/domain/value-objects/avis-prefet'
import { isPhaseInstruction } from '@shared/core/domain/value-objects/phase-instruction'
import { gristReady } from './grist-ready'
import {
    asBoolean,
    asDate,
    asNumber,
    asString,
    byRowId,
    fetchRowsOnce,
    lookup,
} from './grist-helpers'
import { COLUMNS, TABLE } from './grist-tables'

export function createGristInstructionQuery(): InstructionQuery {
    return {
        async list() {
            await gristReady()

            const [rows, crbs] = await Promise.all([
                fetchRowsOnce(TABLE.instruction, COLUMNS.instruction),
                fetchRowsOnce(TABLE.crb, COLUMNS.crb),
            ])

            // `crb` and `subvention` are both Refs, holding a rowId. The
            // demande is kept as one — that is how the domain identifies it —
            // while the CRB is only ever read as a name, so it is resolved
            // here rather than by every screen that shows one.
            const crbById = byRowId(crbs)

            return rows.map((row) => ({
                crb: asString(lookup(crbById, row.crb)?.Nom),
                subvention: asNumber(row.subvention) ?? 0,
                name: asString(row.Nom),
                avisCrbRequis: asBoolean(row.Avis_CRB_Requis),
                dateSaisineCrb: asDate(row.Date_saisine_CRB),
                dateAvisCrb: asDate(row.Date_avis_CRB),
                // An empty cell means the step has not happened yet, which is
                // what "En attente" says.
                avisCRB: isAvisCRB(row.Avis_CRB) ? row.Avis_CRB : 'En attente',
                dateAvisPrefet: asDate(row.Date_avis_Prefet),
                avisPrefet: isAvisPrefet(row.Avis_Prefet)
                    ? row.Avis_Prefet
                    : 'En attente',
                // The phase is a formula, so a value we don't know is a
                // formula that changed. Falling back to the phase every
                // instruction passes through keeps the chronology readable,
                // and the dates it also reads put the marker back in place.
                phase: isPhaseInstruction(row.Phase_de_l_instruction)
                    ? row.Phase_de_l_instruction
                    : "En cours d'instruction",
            }))
        },
    }
}
