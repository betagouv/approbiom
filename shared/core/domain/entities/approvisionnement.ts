import type { Provenance } from '@shared/core/domain/value-objects/provenance'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { PlanDApprovisionnement } from '@shared/core/domain/entities/plan-d-approvisionnement'
import type { Ressource } from '@shared/core/domain/entities/ressource'

export type Approvisionnement = {
    planDApprovisionnement: PlanDApprovisionnement['id']
    ressource: Ressource['code']
    provenance: Provenance
    fournisseur: Entreprise['siret']
    tonnageTotal: number
}
