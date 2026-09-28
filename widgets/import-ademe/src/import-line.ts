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
import type {
    ExtractedApprovisionnementPort,
    StoredExtractedLine,
} from './extracted-approvisionnement-port'

function toProvenance({
    source,
    provenance,
}: ProvenanceRepartition): Provenance {
    return source === PAYS_ETRANGER
        ? { source: PAYS_ETRANGER, libelle: provenance }
        : { source: DEPARTEMENT_FRANCAIS, code: provenance }
}

// One approvisionnement per provenance of the line. Empty when the line
// misses a fournisseur, a ressource or a provenance: it cannot be imported.
export function toApprovisionnements(
    line: StoredExtractedLine,
    plan: PlanDApprovisionnement['id'],
    source: Attachment['id']
): Approvisionnement[] {
    const { matchedFournisseur, matchedRessource, parsedProvenance } =
        line.derived
    if (!matchedFournisseur || !matchedRessource) return []

    return parsedProvenance.distribution.map((repartition) => ({
        planDApprovisionnement: plan,
        fournisseur: matchedFournisseur.siret,
        ressource: matchedRessource.code,
        provenance: toProvenance(repartition),
        tonnageTotal: (line.read.tonnage * repartition.percentage) / 100,
        additionalDataFromDocument: line.read.additionalData,
        source,
    }))
}

export async function importLine(
    approvisionnements: readonly Approvisionnement[],
    line: StoredExtractedLine,
    ports: {
        approvisionnements: Pick<ApprovisionnementPort, 'create'>
        extractedApprovisionnements: Pick<
            ExtractedApprovisionnementPort,
            'markAsImported'
        >
    }
): Promise<void> {
    await ports.approvisionnements.create(approvisionnements)
    await ports.extractedApprovisionnements.markAsImported(line.id)
}
