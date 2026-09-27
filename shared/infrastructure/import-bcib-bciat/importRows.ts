import { extractRows, type ReadLineWithProvenanceParseResults } from './helpers'
import { loadReferenceData } from './transform-provenance/reference-data'
import { transformProvenance } from './transform-provenance/transform-provenance'

export async function importRows(
    file: Blob,
    document: string
): Promise<ReadLineWithProvenanceParseResults[]> {
    const reference = loadReferenceData()

    return (await extractRows(file, document)).map((line) => ({
        ...line,
        provenanceParseResults: transformProvenance(
            line.rawProvenance,
            reference
        ),
    }))
}
