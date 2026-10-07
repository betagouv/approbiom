import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { Pays } from '@shared/core/domain/value-objects/pays'

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
        fournisseur?: Entreprise['siret']
    }

export interface ApprovisionnementPort {
    list(): Promise<readonly Approvisionnement[]>

    create(
        approvisionnements: readonly Omit<Approvisionnement, 'id'>[]
    ): Promise<Approvisionnement['id'][]>

    update(
        id: Approvisionnement['id'],
        approvisionnement: Partial<Approvisionnement>
    ): Promise<void>

    delete(id: Approvisionnement['id']): Promise<void>

    listPaysDeProvenance(): Promise<readonly Pays[]>

    addPaysDeProvenance(pays: Pays): Promise<void>

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
