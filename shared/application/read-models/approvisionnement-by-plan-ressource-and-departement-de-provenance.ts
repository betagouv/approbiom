import type { Approvisionnement } from '@shared/domain/approvisionnement'
import type { ApprovisionnementByPlanAndRessource } from './approvisionnement-by-plan-and-ressource'

/**
 * The (plan, ressource) total split by département de provenance, identified by
 * its INSEE code. The libellé is read from the département directory.
 */
export type ApprovisionnementByPlanRessourceAndDepartementDeProvenance =
    ApprovisionnementByPlanAndRessource &
        Pick<Approvisionnement, 'departementDeProvenance'>
