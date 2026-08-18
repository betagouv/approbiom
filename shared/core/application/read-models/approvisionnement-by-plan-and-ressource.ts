import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'

export type ApprovisionnementByPlanAndRessource = Pick<
    Approvisionnement,
    'planDApprovisionnement' | 'ressource'
> & {
    sumTonnageTotal?: number
    repartition?: number
}
