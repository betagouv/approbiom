import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import { extractRows, type ExtractedLine } from './helpers'
import { matchFournisseur } from './match-fournisseur'
import { loadReferenceData } from './transform-provenance/reference-data'
import { transformProvenance } from './transform-provenance/transform-provenance'

export async function importRows(
    file: Blob,
    document: string,
    entreprises: readonly Entreprise[]
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
        },
    }))
}
