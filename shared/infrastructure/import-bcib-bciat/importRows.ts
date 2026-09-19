import { extractRows, type ImportedLines } from './helpers'
import { loadReferenceData } from './transform-provenance/reference-data'
import { transformProvenance } from './transform-provenance/transform-provenance'

export async function importRows(
    file: Blob,
    document: string
): Promise<ImportedLines[]> {
    const reference = loadReferenceData()

    return (await extractRows(file, document)).map((line) => {
        const { distribution, confidence, unrecognized } = transformProvenance(
            line.rawProvenance,
            reference
        )

        return {
            ...line,
            provenance: distribution.map((share) => ({
                ...share,
                additionalData: line.additionalData,
            })),
            confidence,
            unrecognized,
        }
    })
}
