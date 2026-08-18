import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { ApprovisionnementByPlanAndRessource } from '@shared/core/application/read-models/approvisionnement-by-plan-and-ressource'

export type ApprovisionnementByPlanRessourceAndFournisseur =
    ApprovisionnementByPlanAndRessource & Pick<Approvisionnement, 'fournisseur'>
