import { extractRows } from './helpers'
import type { MatchReferences } from '@shared/core/application/ports/document-extractor-approvisionnement'
import { matchFournisseur } from './match-fournisseur'
import { matchRessource } from './match-ressource'
import { loadReferenceData } from './transform-provenance/reference-data'
import { transformProvenance } from './transform-provenance/transform-provenance'
import type { ExtractedLine } from '@shared/core/domain/entities/extracted-approvisionnement'

export async function importRows(
    file: Blob,
    document: string,
    { entreprises, ressources }: MatchReferences
): Promise<ExtractedLine[]> {
    const reference = loadReferenceData()

    return (await extractRows(file, document)).map((read) => ({
        read,
        derived: {
            parsedProvenance: transformProvenance(
                read.rawProvenance,
                reference
            ),
            matchedFournisseur: matchFournisseur(read.supplier, entreprises),
            matchedRessource: matchRessource(read.resource, ressources),
        },
    }))
}
