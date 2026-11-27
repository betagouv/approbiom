import {
    PAYS_ETRANGER,
    type Provenance,
} from '@shared/core/domain/value-objects/provenance'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { PlanDApprovisionnement } from '@shared/core/domain/entities/plan-d-approvisionnement'
import type { Ressource } from '@shared/core/domain/value-objects/ressource'

export type Approvisionnement = {
    id: number
    planDApprovisionnement: PlanDApprovisionnement['id']
    ressource: Ressource['code']
    provenance: Provenance
    fournisseur?: Entreprise['siret']
    tonnageTotal: number
    additionalDataFromDocument?: string
    source?: Attachment['id']
}

const provenanceKey = (provenance: Provenance) =>
    provenance.source === PAYS_ETRANGER
        ? `${provenance.source}|${provenance.libelle}`
        : `${provenance.source}|${provenance.code}`

export const duplicateKey = ({
    fournisseur,
    ressource,
    provenance,
}: Pick<Approvisionnement, 'fournisseur' | 'ressource' | 'provenance'>) =>
    `${fournisseur ?? ''}|${ressource}|${provenanceKey(provenance)}`

export function duplicatedKeys(
    approvisionnements: readonly Approvisionnement[]
): ReadonlySet<string> {
    const seen = new Set<string>()
    const duplicated = new Set<string>()
    for (const approvisionnement of approvisionnements) {
        const key = duplicateKey(approvisionnement)
        if (seen.has(key)) duplicated.add(key)
        seen.add(key)
    }

    return duplicated
}
