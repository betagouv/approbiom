import type { ProgrammeAide } from '@shared/core/domain/entities/programme-aide'
import type { DepartementsByRegion } from '@shared/core/application/ports/insee'
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

export type AccueilPorts = PlanDetailPorts &
    ApprovisionnementByRessourceStatsPorts

export type AccueilScreen = {
    plansApprovisionnement: readonly PlanDetail[]
    programmesAide: readonly ProgrammeAide[]
    departementsByRegion: readonly DepartementsByRegion[]
    approvisionnementByRessourceStatsList: ApprovisionnementByRessourceStatsByPlan
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
        ports.insee.listDepartementsByRegion(),
        getApprovisionnementByRessourceStatsByPlan(ports),
    ])

    return {
        plansApprovisionnement,
        programmesAide,
        departementsByRegion,
        approvisionnementByRessourceStatsList,
    }
}
