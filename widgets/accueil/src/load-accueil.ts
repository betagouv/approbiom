import type { ProgrammeAide } from '@shared/core/domain/entities/programme-aide'
import type { AttachmentQuery } from '@shared/core/application/ports/attachment'
import type { DemandeSubventionQuery } from '@shared/core/application/ports/demande-subvention'
import type { InstallationQuery } from '@shared/core/application/ports/installation'
import type { InstructionQuery } from '@shared/core/application/ports/instruction'
import type { ProgrammeAideQuery } from '@shared/core/application/ports/programme-aide'
import type { DepartementsByRegion } from '@shared/core/application/ports/insee'
import {
    getPlanDetails,
    type PlanDetail,
} from '@shared/core/application/services/plan-detail'
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
    plansApprovisionnement: readonly PlanDetail[]
    ressource: RessourceScreen
    programmesAide: readonly ProgrammeAide[]
    departementsByRegion: readonly DepartementsByRegion[]
}

/**
 * What this screen shows, and nothing more: the plan details come composed
 * from the application, so all that is left here is the two directories the
 * filters are drawn from, and the ressource screen the dossier opens onto.
 */
export async function loadAccueil(ports: AccueilPorts): Promise<AccueilScreen> {
    const [
        plansApprovisionnement,
        ressource,
        programmesAide,
        departementsByRegion,
    ] = await Promise.all([
        getPlanDetails(ports),
        loadRessource(ports),
        ports.programmesAide.list(),
        ports.insee.listDepartementsByRegion(),
    ])

    return {
        plansApprovisionnement,
        ressource,
        programmesAide,
        departementsByRegion,
    }
}
