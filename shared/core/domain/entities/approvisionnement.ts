import type { Provenance } from '@shared/core/domain/value-objects/provenance'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { PlanDApprovisionnement } from '@shared/core/domain/entities/plan-d-approvisionnement'
import type { Ressource } from '@shared/core/domain/entities/ressource'

export type Approvisionnement = {
    id: number
    planDApprovisionnement: PlanDApprovisionnement['id']
    ressource: Ressource['code']
    provenance: Provenance
    // Undefined when the fournisseur is not known — a plan may leave it out.
    fournisseur?: Entreprise['siret']
    tonnageTotal: number
    // Only set on an approvisionnement imported from a document.
    additionalDataFromDocument?: string
    source?: Attachment['id']
}
