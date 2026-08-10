import type { ApprovisionnementByPlanAndRessource } from '@shared/application/read-models/approvisionnement-by-plan-and-ressource'

export interface ApprovisionnementQuery {
    listByPlanAndRessource(): Promise<
        readonly ApprovisionnementByPlanAndRessource[]
    >
}
