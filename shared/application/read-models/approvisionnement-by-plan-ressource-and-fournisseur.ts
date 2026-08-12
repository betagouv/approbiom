import type { Approvisionnement } from '@shared/domain/approvisionnement'
import type { ApprovisionnementByPlanAndRessource } from './approvisionnement-by-plan-and-ressource'

export type ApprovisionnementByPlanRessourceAndFournisseur =
    ApprovisionnementByPlanAndRessource & Pick<Approvisionnement, 'fournisseur'>
