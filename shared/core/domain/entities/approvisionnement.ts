import type { Departement } from '@shared/core/domain/value-objects/departement'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { PlanDApprovisionnement } from '@shared/core/domain/entities/plan-d-approvisionnement'
import type { Ressource } from '@shared/core/domain/entities/ressource'

export type Approvisionnement = {
    planDApprovisionnement: PlanDApprovisionnement['id']
    ressource: Ressource['code']
    departementDeProvenance: Departement['dep']
    fournisseur: Entreprise['siret']
    tonnageTotal: number
}
