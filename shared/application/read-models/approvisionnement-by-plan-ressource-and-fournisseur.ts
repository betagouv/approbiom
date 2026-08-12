import type { Approvisionnement } from '@shared/application/domain/approvisionnement'
import type { ApprovisionnementByPlanAndRessource } from './approvisionnement-by-plan-and-ressource'

export type ApprovisionnementByPlanRessourceAndFournisseur =
    ApprovisionnementByPlanAndRessource & Pick<Approvisionnement, 'fournisseur'>
