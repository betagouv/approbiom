import type { ProgrammeAide } from '@shared/core/domain/entities/programme-aide'
import type {
    DepartementsByRegion,
    LocalizationPort,
} from '@shared/core/application/ports/localization'
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
    getUpdateInstruction,
    type UpdateInstruction,
    type UpdateInstructionPorts,
} from '@shared/core/application/services/get-update-instruction'
import {
    getUpdateIsPlanLaureatForProgrammeAide,
    type UpdateIsPlanLaureatForProgrammeAide,
    type UpdateIsPlanLaureatForProgrammeAidePorts,
} from '@shared/core/application/services/update-is-plan-laureat-for-programme-aide'

export type AccueilPorts = PlanDetailPorts &
    ApprovisionnementByRessourceStatsPorts &
    UpdateInstructionPorts &
    UpdateIsPlanLaureatForProgrammeAidePorts & {
        getCommuneCenterPosition: LocalizationPort['getCommuneCenterPosition']
        getDepartementContour: LocalizationPort['getDepartementContour']
        getCountryContour: LocalizationPort['getCountryContour']
    }

export type AccueilScreen = {
    plansApprovisionnement: readonly PlanDetail[]
    programmesAide: readonly ProgrammeAide[]
    departementsByRegion: readonly DepartementsByRegion[]
    approvisionnementByRessourceStatsList: ApprovisionnementByRessourceStatsByPlan
    updateInstruction: UpdateInstruction
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
        updateInstruction: getUpdateInstruction(ports),
        updateIsPlanLaureatForProgrammeAide:
            getUpdateIsPlanLaureatForProgrammeAide(ports),
    }
}
