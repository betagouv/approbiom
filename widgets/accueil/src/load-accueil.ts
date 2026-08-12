import type { DemandeSubventionQuery } from '@shared/application/ports/demande-subvention-query'
import type { InstructionQuery } from '@shared/application/ports/instruction-query'
import type { ProgrammeAideQuery } from '@shared/application/ports/programme-aide-query'
import type { FilInstructionData } from '@shared/application/read-models/instructions-by-programme-aide'
import type { Plan } from '@shared/application/read-models/plan'
import {
    loadRessource,
    type RessourcePorts,
    type RessourceScreen,
} from '@shared/screens/ressource'

export type AccueilPorts = RessourcePorts & {
    demandesSubvention: DemandeSubventionQuery
    programmesAide: ProgrammeAideQuery
    instructions: InstructionQuery
}

export type AccueilScreen = {
    plansApprovisionnement: readonly Plan[]
    ressource: RessourceScreen
    filInstruction: FilInstructionData
}

export async function loadAccueil(ports: AccueilPorts): Promise<AccueilScreen> {
    const [
        plansApprovisionnement,
        ressource,
        demandesSubvention,
        programmesAide,
        instructions,
    ] = await Promise.all([
        ports.plans.list(),
        loadRessource(ports),
        ports.demandesSubvention.list(),
        ports.programmesAide.list(),
        ports.instructions.list(),
    ])

    return {
        plansApprovisionnement,
        ressource,
        filInstruction: { demandesSubvention, programmesAide, instructions },
    }
}
