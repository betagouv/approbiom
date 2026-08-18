import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { ApprovisionnementByPlanAndRessource } from './approvisionnement-by-plan-and-ressource'

export type ApprovisionnementByPlanRessourceAndFournisseur =
    ApprovisionnementByPlanAndRessource & Pick<Approvisionnement, 'fournisseur'>
