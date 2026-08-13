import type { DemandeSubventionQuery } from '@shared/application/ports/demande-subvention-query'
import type { InstallationQuery } from '@shared/application/ports/installation-query'
import type { InstructionQuery } from '@shared/application/ports/instruction-query'
import type { ProgrammeAideQuery } from '@shared/application/ports/programme-aide-query'
import type { DepartementsByRegion } from '@shared/application/read-models/departements-by-region'
import type { FilInstructionData } from '@shared/application/read-models/instructions-by-programme-aide'
import {
    getPlansAccueil,
    type PlanAccueil,
} from '@shared/application/read-models/plan-accueil'
import {
    loadRessource,
    type RessourcePorts,
    type RessourceScreen,
} from '@shared/screens/ressource'

export type AccueilPorts = RessourcePorts & {
    demandesSubvention: DemandeSubventionQuery
    programmesAide: ProgrammeAideQuery
    instructions: InstructionQuery
    installations: InstallationQuery
}

export type AccueilScreen = {
    plansApprovisionnement: readonly PlanAccueil[]
    ressource: RessourceScreen
    filInstruction: FilInstructionData
    departementsByRegion: readonly DepartementsByRegion[]
}

export async function loadAccueil(ports: AccueilPorts): Promise<AccueilScreen> {
    const [
        plans,
        ressource,
        demandesSubvention,
        programmesAide,
        instructions,
        installations,
        departementsByRegion,
    ] = await Promise.all([
        ports.plans.list(),
        loadRessource(ports),
        ports.demandesSubvention.list(),
        ports.programmesAide.list(),
        ports.instructions.list(),
        ports.installations.list(),
        ports.insee.listDepartementsByRegion(),
    ])

    return {
        plansApprovisionnement: getPlansAccueil(
            plans,
            installations,
            departementsByRegion
        ),
        ressource,
        filInstruction: { demandesSubvention, programmesAide, instructions },
        departementsByRegion,
    }
}
