import type { ExtractedLine } from '@shared/infrastructure/import-bcib-bciat/helpers'
import type {
    ExtractedApprovisionnementPort,
    StoredExtractedLine,
} from '../extracted-approvisionnement-port'

// Stands in for the table « Approvisionnement extrait d'un document », in
// memory: it lasts as long as the page. `isCreated` stands in for the Grist
// formula that tells a created line apart.
export function createFakeExtractedApprovisionnements(
    isCreated: (line: ExtractedLine) => boolean = () => false
): ExtractedApprovisionnementPort {
    const rows = new Map<number, StoredExtractedLine[]>()
    let nextId = 1

    return {
        listByDocument: (attachment) =>
            Promise.resolve(
                (rows.get(attachment.id) ?? []).map((row) => ({
                    ...row,
                    state: isCreated(row) ? 'Créés' : 'Pas créés',
                    read: { ...row.read, document: attachment.name },
                }))
            ),
        listSummaries: () =>
            Promise.resolve(
                [...rows].map(([attachmentId, lines]) => ({
                    attachmentId,
                    extractedAt: lines[0].extractedAt,
                    lineCount: lines.length,
                    createdCount: lines.filter(isCreated).length,
                }))
            ),
        create: (attachment, lines, extractedAt) => {
            rows.set(attachment.id, [
                ...(rows.get(attachment.id) ?? []),
                ...lines.map((line) => ({
                    ...line,
                    id: nextId++,
                    state: 'Pas créés' as const,
                    extractedAt,
                })),
            ])

            return Promise.resolve()
        },
        update: (id, changes) => {
            for (const [attachmentId, lines] of rows)
                rows.set(
                    attachmentId,
                    lines.map((line) =>
                        line.id === id
                            ? {
                                  ...line,
                                  derived: { ...line.derived, ...changes },
                              }
                            : line
                    )
                )

            return Promise.resolve()
        },
    }
}
