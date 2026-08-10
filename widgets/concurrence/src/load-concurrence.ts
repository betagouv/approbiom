import type { ApprovisionnementQuery } from '@shared/application/ports/approvisionnement-query'
import type { InseeQuery } from '@shared/application/ports/insee-query'
import type { ApprovisionnementByPlanAndRessource } from '@shared/application/read-models/approvisionnement-by-plan-and-ressource'
import type { DepartementsByRegion } from '@shared/application/read-models/departements-by-region'

export type ConcurrencePorts = {
    approvisionnements: ApprovisionnementQuery
    insee: InseeQuery
}

export type ConcurrenceScreen = {
    approvisionnementsByPlanAndRessource: readonly ApprovisionnementByPlanAndRessource[]
    departementsByRegion: readonly DepartementsByRegion[]
}

export async function loadConcurrence(
    ports: ConcurrencePorts
): Promise<ConcurrenceScreen> {
    const [approvisionnements, departementsByRegion] = await Promise.all([
        ports.approvisionnements.listByPlanAndRessource(),
        ports.insee.listDepartementsByRegion(),
    ])

    return {
        approvisionnementsByPlanAndRessource: approvisionnements,
        departementsByRegion,
    }
}
