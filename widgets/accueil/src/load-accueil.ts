import type { ProgrammeAide } from '@shared/application/domain/programme-aide'
import type { AttachmentQuery } from '@shared/application/ports/attachment-query'
import type { DemandeSubventionQuery } from '@shared/application/ports/demande-subvention-query'
import type { InstallationQuery } from '@shared/application/ports/installation-query'
import type { InstructionQuery } from '@shared/application/ports/instruction-query'
import type { ProgrammeAideQuery } from '@shared/application/ports/programme-aide-query'
import type { DepartementsByRegion } from '@shared/application/read-models/departements-by-region'
import {
    getPlansAccueil,
    type PlanAccueil,
} from '@shared/application/read-models/plan-accueil'
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
