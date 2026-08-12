import type { Plan } from '@shared/application/read-models/plan'
import type { DemandeSubvention } from '@shared/application/domain/demande-subvention'
import type { Instruction } from '@shared/application/domain/instruction'
import type { ProgrammeAide } from '@shared/application/domain/programme-aide'

export type InstructionsByProgrammeAide = {
    programmeAide: ProgrammeAide
    instructions: readonly Instruction[]
}

export type FilInstructionData = {
    demandesSubvention: readonly DemandeSubvention[]
    programmesAide: readonly ProgrammeAide[]
    instructions: readonly Instruction[]
}

export function getInstructionsByProgrammeAide(
    { demandesSubvention, programmesAide, instructions }: FilInstructionData,
    plan: Plan['id']
): readonly InstructionsByProgrammeAide[] {
    const programmeById = new Map(
        programmesAide.map((programme) => [programme.id, programme])
    )

    const instructionsBySubvention = new Map<
        DemandeSubvention['id'],
        Instruction[]
    >()
    for (const instruction of instructions) {
        // An empty Ref reads as 0. Left in, every instruction whose demande
        // could not be resolved would group under the same key.
        if (instruction.subvention === 0) continue

        const group = instructionsBySubvention.get(instruction.subvention) ?? []
        group.push(instruction)
        instructionsBySubvention.set(instruction.subvention, group)
    }

    const blocks = new Map<ProgrammeAide['id'], InstructionsByProgrammeAide>()

    for (const demande of demandesSubvention) {
        if (demande.planDApprovisionnement !== plan) continue

        // A block is titled by its programme, so a demande pointing at one we
        // cannot name has no chronology to head and is left out.
        const programmeAide = programmeById.get(demande.programmeAide)
        if (programmeAide === undefined) continue

        const previous = blocks.get(programmeAide.id)?.instructions ?? []

        blocks.set(programmeAide.id, {
            programmeAide,
            instructions: [
                ...previous,
                ...(instructionsBySubvention.get(demande.id) ?? []),
            ],
        })
    }

    return [...blocks.values()]
}
