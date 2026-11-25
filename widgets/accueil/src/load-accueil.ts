import type { ProgrammeAide } from '@shared/core/domain/entities/programme-aide'
import type { AttachmentPort } from '@shared/core/application/ports/attachment'
import type { InstructionPort } from '@shared/core/application/ports/instruction'
import type {
    DepartementsByRegion,
    ReferentielGeoPort,
} from '@shared/core/application/ports/referentiel-geo'
import {
    getApprovisionnementByRessourceStatsByPlan,
    type ApprovisionnementByRessourceStatsByPlan,
    type ApprovisionnementByRessourceStatsPorts,
} from '@shared/core/application/services/approvisionnement-stats'
import {
    getPlanDetails,
    type PlanDetail,
    type PlanDetailPorts,
} from '@shared/core/application/services/plan-detail'
import {
    getUpdateIsPlanLaureatForProgrammeAide,
    type UpdateIsPlanLaureatForProgrammeAide,
    type UpdateIsPlanLaureatForProgrammeAidePorts,
} from '@shared/core/application/services/update-is-plan-laureat-for-programme-aide'

export type AccueilPorts = PlanDetailPorts &
    ApprovisionnementByRessourceStatsPorts &
    UpdateIsPlanLaureatForProgrammeAidePorts & {
        getCommuneCenterPosition: ReferentielGeoPort['getCommuneCenterPosition']
        getCommuneNom: ReferentielGeoPort['getCommuneNom']
        getDepartementContour: ReferentielGeoPort['getDepartementContour']
        getCountryContour: ReferentielGeoPort['getCountryContour']
        attachments: Pick<AttachmentPort, 'listByPlan' | 'getFileUrl'>
    }

export type AccueilScreen = {
    plansApprovisionnement: readonly PlanDetail[]
    programmesAide: readonly ProgrammeAide[]
    departementsByRegion: readonly DepartementsByRegion[]
    approvisionnementByRessourceStatsList: ApprovisionnementByRessourceStatsByPlan
    updateInstruction: InstructionPort['update']
    updateIsPlanLaureatForProgrammeAide: UpdateIsPlanLaureatForProgrammeAide
}

export async function loadAccueil(ports: AccueilPorts): Promise<AccueilScreen> {
    const [
        plansApprovisionnement,
        programmesAide,
        departementsByRegion,
        approvisionnementByRessourceStatsList,
    ] = await Promise.all([
        getPlanDetails(ports),
        ports.programmesAide.list(),
        ports.listDepartementsByRegion(),
        getApprovisionnementByRessourceStatsByPlan(ports),
    ])

    return {
        plansApprovisionnement,
        programmesAide,
        departementsByRegion,
        approvisionnementByRessourceStatsList,
        updateInstruction: (instructionId, updateData) =>
            ports.instructions.update(instructionId, updateData),
        updateIsPlanLaureatForProgrammeAide:
            getUpdateIsPlanLaureatForProgrammeAide(ports),
    }
}
