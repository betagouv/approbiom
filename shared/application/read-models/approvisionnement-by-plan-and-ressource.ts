import type { Approvisionnement } from '@shared/domain/approvisionnement'
import type { Departement } from '@shared/domain/departement'
import type { PlanDApprovisionnement } from '@shared/domain/plan-d-approvisionnement'
import type { Ressource } from '@shared/domain/ressource'

export type ApprovisionnementByPlanAndRessource = {
    planDApprovisionnement: PlanDApprovisionnement['nom']
    ressource: Ressource['title']
    approvisionnements: Pick<
        Approvisionnement,
        'departementDeProvenance' | 'tonnageTotal' | 'fournisseur'
    >[]
    departementDeSituation: Departement['libelle']
    sumTonnageTotal?: number
}
