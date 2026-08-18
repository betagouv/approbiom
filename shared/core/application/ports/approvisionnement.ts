import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { Region } from '@shared/core/domain/value-objects/region'

export interface ApprovisionnementQuery {
    listApprovisionnements(): Promise<readonly Approvisionnement[]>

    listByPlanAndRessource(): Promise<
        readonly ApprovisionnementByPlanAndRessource[]
    >

    listByPlanRessourceAndRegion(): Promise<
        readonly ApprovisionnementByPlanRessourceAndRegion[]
    >

    listByPlanRessourceAndFournisseur(): Promise<
        readonly ApprovisionnementByPlanRessourceAndFournisseur[]
    >

    listByPlanRessourceAndDepartementDeProvenance(): Promise<
        readonly ApprovisionnementByPlanRessourceAndDepartementDeProvenance[]
    >
}

export type ApprovisionnementByPlanAndRessource = Pick<
    Approvisionnement,
    'planDApprovisionnement' | 'ressource'
> & {
    sumTonnageTotal?: number
    repartition?: number
}

/**
 * The (plan, ressource) total split by département de provenance, identified by
 * its INSEE code. The libellé is read from the département directory.
 */
export type ApprovisionnementByPlanRessourceAndDepartementDeProvenance =
    ApprovisionnementByPlanAndRessource &
        Pick<Approvisionnement, 'departementDeProvenance'>

export type ApprovisionnementByPlanRessourceAndFournisseur =
    ApprovisionnementByPlanAndRessource & Pick<Approvisionnement, 'fournisseur'>

export type ApprovisionnementByPlanRessourceAndRegion =
    ApprovisionnementByPlanAndRessource & {
        region: Region['libelle']
    }
