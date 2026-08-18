import type { ProgrammeAide } from '@shared/core/domain/entities/programme-aide'
import type { DepartementsByRegion } from '@shared/core/application/ports/insee'
import type { ApprovisionnementStatsPorts } from '@shared/core/application/services/approvisionnement-stats'
import {
    getPlanDetails,
    type PlanDetail,
    type PlanDetailPorts,
} from '@shared/core/application/services/plan-detail'

export type AccueilPorts = PlanDetailPorts & ApprovisionnementStatsPorts

export type AccueilScreen = {
    plansApprovisionnement: readonly PlanDetail[]
    programmesAide: readonly ProgrammeAide[]
    departementsByRegion: readonly DepartementsByRegion[]
}

export async function loadAccueil(ports: AccueilPorts): Promise<AccueilScreen> {
    const [plansApprovisionnement, programmesAide, departementsByRegion] =
        await Promise.all([
            getPlanDetails(ports),
            ports.programmesAide.list(),
            ports.insee.listDepartementsByRegion(),
        ])

    return {
        plansApprovisionnement,
        programmesAide,
        departementsByRegion,
    }
}
