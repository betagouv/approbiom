import type { ProgrammeAide } from '@shared/core/domain/entities/programme-aide'
import type { AttachmentQuery } from '@shared/core/application/ports/attachment-query'
import type { DemandeSubventionQuery } from '@shared/core/application/ports/demande-subvention-query'
import type { InstallationQuery } from '@shared/core/application/ports/installation-query'
import type { InstructionQuery } from '@shared/core/application/ports/instruction-query'
import type { ProgrammeAideQuery } from '@shared/core/application/ports/programme-aide-query'
import type { DepartementsByRegion } from '@shared/core/application/read-models/departements-by-region'
import { getPlansAccueil, type PlanAccueil } from '@shared/core/plan-accueil'
import {
    loadRessource,
    type RessourcePorts,
    type RessourceScreen,
} from '@shared/user-interface/screen/ressource'

export type AccueilPorts = RessourcePorts & {
    demandesSubvention: DemandeSubventionQuery
    programmesAide: ProgrammeAideQuery
    instructions: InstructionQuery
    installations: InstallationQuery
    attachments: AttachmentQuery
}

export type AccueilScreen = {
    plansApprovisionnement: readonly PlanAccueil[]
    ressource: RessourceScreen
    programmesAide: readonly ProgrammeAide[]
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
        entreprises,
        attachments,
    ] = await Promise.all([
        ports.plans.list(),
        loadRessource(ports),
        ports.demandesSubvention.list(),
        ports.programmesAide.list(),
        ports.instructions.list(),
        ports.installations.list(),
        ports.insee.listDepartementsByRegion(),
        ports.entreprises.list(),
        ports.attachments.list(),
    ])

    return {
        plansApprovisionnement: getPlansAccueil({
            plans,
            installations,
            departementsByRegion,
            demandesSubvention,
            programmesAide,
            instructions,
            approvisionnementsByFournisseur: ressource.byFournisseur,
            entreprises,
            attachments,
        }),
        ressource,
        programmesAide,
        departementsByRegion,
    }
}
