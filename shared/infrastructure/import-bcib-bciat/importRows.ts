import {
    extractRows,
    type ExtractedLine,
    type MatchReferences,
} from './helpers'
import { matchFournisseur } from './match-fournisseur'
import { matchRessource } from './match-ressource'
import { loadReferenceData } from './transform-provenance/reference-data'
import { transformProvenance } from './transform-provenance/transform-provenance'

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
