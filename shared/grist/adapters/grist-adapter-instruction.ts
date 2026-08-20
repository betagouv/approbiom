import type {
    InstructionPort,
    InstructionUpdateData,
} from '@shared/core/application/ports/instruction'
import { isAvisCRB } from '@shared/core/domain/value-objects/avis-crb'
import { isAvisPrefet } from '@shared/core/domain/value-objects/avis-prefet'
import { isPhaseInstruction } from '@shared/core/domain/value-objects/phase-instruction'
import { gristReady } from '../grist-ready'
import {
    asBoolean,
    asDate,
    asNumber,
    asString,
    fetchRowsOnce,
    updateRow,
    type GristCells,
    type GristRow,
} from '../grist-helpers'
import { COLUMNS, TABLE, type InstructionColumn } from '../grist-tables'
import type { Instruction } from '@shared/core/domain/entities/instruction'

const MAPPING_COLUMNS_INSTRUCTION = {
    avisCRB: 'Avis_CRB',
    avisPrefet: 'Avis_Prefet',
    avisCrbRequis: 'Avis_CRB_Requis',
} as const satisfies Partial<Record<keyof Instruction, InstructionColumn>>

function getGristFieldsToUpdate(updateData: InstructionUpdateData): GristCells {
    const cells: GristCells = {}

    if (updateData.avisCRB !== undefined)
        cells[MAPPING_COLUMNS_INSTRUCTION.avisCRB] = updateData.avisCRB

    if (updateData.avisPrefet !== undefined)
        cells[MAPPING_COLUMNS_INSTRUCTION.avisPrefet] = updateData.avisPrefet

    if (updateData.avisCrbRequis !== undefined)
        cells[MAPPING_COLUMNS_INSTRUCTION.avisCrbRequis] =
            updateData.avisCrbRequis

    return cells
}

function mapFromGristToApplication(row: GristRow): Instruction {
    return {
        id: asNumber(row.id) ?? 0,
        crb: asNumber(row.crb) ?? 0,
        subvention: asNumber(row.subvention) ?? 0,
        name: asString(row.Nom),
        avisCrbRequis: asBoolean(row.Avis_CRB_Requis),
        dateSaisineCrb: asDate(row.Date_saisine_CRB),
        dateAvisCrb: asDate(row.Date_avis_CRB),
        avisCRB: isAvisCRB(row.Avis_CRB) ? row.Avis_CRB : 'En attente',
        dateAvisPrefet: asDate(row.Date_avis_Prefet),
        avisPrefet: isAvisPrefet(row.Avis_Prefet)
            ? row.Avis_Prefet
            : 'En attente',
        phase: isPhaseInstruction(row.Phase_de_l_instruction)
            ? row.Phase_de_l_instruction
            : "En cours d'instruction",
    }
}

export function createGristInstructionPort(): InstructionPort {
    return {
        async list() {
            await gristReady()

            const rows = await fetchRowsOnce(
                TABLE.instruction,
                COLUMNS.instruction
            )

            return rows.map(mapFromGristToApplication)
        },
        async update(instructionId, updateData) {
            await gristReady()

            const updatedInstruction = await updateRow(
                TABLE.instruction,
                instructionId,
                getGristFieldsToUpdate(updateData)
            )

            return mapFromGristToApplication(updatedInstruction)
        },
    }
}
