import type { Approvisionnement } from '@shared/domain/approvisionnement'

export type ApprovisionnementByPlanAndRessource = Pick<
    Approvisionnement,
    'planDApprovisionnement' | 'ressource'
> & {
    sumTonnageTotal?: number
    repartition?: number
}
