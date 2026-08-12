import type { Departement } from './departement'
import type { Entreprise } from './entreprise'
import type { PlanDApprovisionnement } from './plan-d-approvisionnement'
import type { Ressource } from './ressource'

export type Approvisionnement = {
    planDApprovisionnement: PlanDApprovisionnement['id']
    ressource: Ressource['code']
    departementDeProvenance: Departement['dep']
    fournisseur: Entreprise['siret']
    tonnageTotal: number
}
