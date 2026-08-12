import type { Approvisionnement } from '@shared/application/domain/approvisionnement'
import type { ApprovisionnementByPlanAndRessource } from '@shared/application/read-models/approvisionnement-by-plan-and-ressource'
import type { ApprovisionnementByPlanRessourceAndDepartementDeProvenance } from '@shared/application/read-models/approvisionnement-by-plan-ressource-and-departement-de-provenance'
import type { ApprovisionnementByPlanRessourceAndFournisseur } from '@shared/application/read-models/approvisionnement-by-plan-ressource-and-fournisseur'
import type { ApprovisionnementByPlanRessourceAndRegion } from '@shared/application/read-models/approvisionnement-by-plan-ressource-and-region'

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
