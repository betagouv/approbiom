import type { ApprovisionnementPort } from '@shared/core/application/ports/approvisionnement'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { PlanDApprovisionnement } from '@shared/core/domain/entities/plan-d-approvisionnement'
import {
    DEPARTEMENT_FRANCAIS,
    PAYS_ETRANGER,
    type Provenance,
} from '@shared/core/domain/value-objects/provenance'
import type { ProvenanceRepartition } from '@shared/infrastructure/import-bcib-bciat/transform-provenance/transform-provenance'
import type { StoredExtractedLine } from './extracted-approvisionnement-port'

function toProvenance({
    source,
    provenance,
}: ProvenanceRepartition): Provenance {
    return source === PAYS_ETRANGER
        ? { source: PAYS_ETRANGER, libelle: provenance }
        : { source: DEPARTEMENT_FRANCAIS, code: provenance }
}

// One approvisionnement per provenance of the line. Empty when the line
// misses a fournisseur, a ressource or a provenance, or has a provenance left
// blank: it cannot be imported.
export function toApprovisionnements(
    line: StoredExtractedLine,
    plan: PlanDApprovisionnement['id'],
    source: Attachment['id']
): Omit<Approvisionnement, 'id'>[] {
    const { matchedFournisseur, matchedRessource, parsedProvenance } =
        line.derived

    if (
        !matchedRessource ||
        parsedProvenance.distribution.some(
            ({ provenance }) => provenance === ''
        )
    )
        return []

    return parsedProvenance.distribution.map((repartition) => ({
        planDApprovisionnement: plan,
        fournisseur: matchedFournisseur?.siret,
        ressource: matchedRessource.code,
        provenance: toProvenance(repartition),
        tonnageTotal: (line.read.tonnage * repartition.percentage) / 100,
        additionalDataFromDocument: line.read.additionalData,
        source,
    }))
}

// Whether the line counts as imported is computed by Grist, off what exists in
// Approvisionnement: nothing is written back on the line itself.
export async function importLine(
    approvisionnements: readonly Omit<Approvisionnement, 'id'>[],
    ports: { approvisionnements: Pick<ApprovisionnementPort, 'create'> }
): Promise<void> {
    await ports.approvisionnements.create(approvisionnements)
}
