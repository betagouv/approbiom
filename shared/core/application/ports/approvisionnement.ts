import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { Departement } from '@shared/core/domain/value-objects/departement'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { Region } from '@shared/core/domain/value-objects/region'

export type ApprovisionnementGroupedByPlanAndRessource = Pick<
    Approvisionnement,
    'planDApprovisionnement' | 'ressource' | 'tonnageTotal'
> & {
    /** between 0 and 1. */
    repartition: number
}

export type ApprovisionnementGroupedByPlanRessourceAndRegion =
    ApprovisionnementGroupedByPlanAndRessource & {
        region: Region['libelle']
    }

export type ApprovisionnementGroupedByPlanRessourceAndDepartement =
    ApprovisionnementGroupedByPlanAndRessource & {
        departement: Departement['dep']
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

    listGroupedByPlanRessourceAndRegion(): Promise<
        readonly ApprovisionnementGroupedByPlanRessourceAndRegion[]
    >

    listGroupedByPlanRessourceAndDepartement(): Promise<
        readonly ApprovisionnementGroupedByPlanRessourceAndDepartement[]
    >

    listGroupedByPlanRessourceAndFournisseur(): Promise<
        readonly ApprovisionnementGroupedByPlanRessourceAndFournisseur[]
    >
}
