import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'

export type ApprovisionnementGroupedByPlanAndRessource = Pick<
    Approvisionnement,
    'planDApprovisionnement' | 'ressource' | 'tonnageTotal'
> & {
    /** between 0 and 1. */
    repartition: number
}

export type ApprovisionnementGroupedByPlanRessourceAndRegionOuPays =
    ApprovisionnementGroupedByPlanAndRessource & {
        regionOuPays: string
    }

export type ApprovisionnementGroupedByPlanRessourceAndProvenance =
    ApprovisionnementGroupedByPlanAndRessource & {
        provenance: string
    }

export type ApprovisionnementGroupedByPlanRessourceAndFournisseur =
    ApprovisionnementGroupedByPlanAndRessource & {
        fournisseur: Entreprise['siret']
    }

export interface ApprovisionnementPort {
    list(): Promise<readonly Approvisionnement[]>

    listGroupedByPlanAndRessource(): Promise<
        readonly ApprovisionnementGroupedByPlanAndRessource[]
    >

    listGroupedByPlanRessourceAndRegionOuPays(): Promise<
        readonly ApprovisionnementGroupedByPlanRessourceAndRegionOuPays[]
    >

    listGroupedByPlanRessourceAndProvenance(): Promise<
        readonly ApprovisionnementGroupedByPlanRessourceAndProvenance[]
    >

    listGroupedByPlanRessourceAndFournisseur(): Promise<
        readonly ApprovisionnementGroupedByPlanRessourceAndFournisseur[]
    >
}
