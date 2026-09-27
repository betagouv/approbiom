import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { ExtractedLine } from '@shared/infrastructure/import-bcib-bciat/helpers'
import type {
    ExtractedApprovisionnementPort,
    StoredExtractedLine,
} from './extracted-approvisionnement-port'

export type ExtractedDocument = {
    lines: readonly StoredExtractedLine[]
    date: Date
}

// Two calls for the same document share one run, so its lines are written
// once — React runs effects twice in development.
const inFlight = new Map<Attachment['id'], Promise<ExtractedDocument>>()

type ExtractDocumentDependencies = {
    extractedApprovisionnements: ExtractedApprovisionnementPort
    downloadAndExtract: () => Promise<readonly ExtractedLine[]>
}

export function extractDocument(
    attachment: Pick<Attachment, 'id' | 'name'>,
    dependencies: ExtractDocumentDependencies
): Promise<ExtractedDocument> {
    const pending = inFlight.get(attachment.id)
    if (pending) return pending

    const run = readOrExtract(attachment, dependencies).finally(() => {
        inFlight.delete(attachment.id)
    })
    inFlight.set(attachment.id, run)

    return run
}

// A document already extracted is read back as it is, not extracted again.
// Either way, what is returned is what the table holds.
async function readOrExtract(
    attachment: Pick<Attachment, 'id' | 'name'>,
    {
        extractedApprovisionnements,
        downloadAndExtract,
    }: ExtractDocumentDependencies
): Promise<ExtractedDocument> {
    const stored = await extractedApprovisionnements.listByDocument(attachment)
    if (stored.length > 0) return { lines: stored, date: stored[0].extractedAt }

    const extractedAt = new Date()
    await extractedApprovisionnements.create(
        attachment,
        await downloadAndExtract(),
        extractedAt
    )

    return {
        lines: await extractedApprovisionnements.listByDocument(attachment),
        date: extractedAt,
    }
}
