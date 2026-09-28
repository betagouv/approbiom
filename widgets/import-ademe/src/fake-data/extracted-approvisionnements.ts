import type {
    ExtractedApprovisionnementPort,
    StoredExtractedLine,
} from '../extracted-approvisionnement-port'

// Stands in for the table « Approvisionnement extrait d'un document », in
// memory: it lasts as long as the page.
export function createFakeExtractedApprovisionnements(): ExtractedApprovisionnementPort {
    const rows = new Map<number, StoredExtractedLine[]>()
    let nextId = 1

    return {
        listByDocument: (attachment) =>
            Promise.resolve(
                (rows.get(attachment.id) ?? []).map((row) => ({
                    ...row,
                    read: { ...row.read, document: attachment.name },
                }))
            ),
        create: (attachment, lines, extractedAt) => {
            rows.set(attachment.id, [
                ...(rows.get(attachment.id) ?? []),
                ...lines.map((line) => ({
                    ...line,
                    id: nextId++,
                    state: 'Pas importés' as const,
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
        markAsImported: (id) => {
            for (const [attachmentId, lines] of rows)
                rows.set(
                    attachmentId,
                    lines.map((line) =>
                        line.id === id
                            ? { ...line, state: 'Importés' as const }
                            : line
                    )
                )

            return Promise.resolve()
        },
    }
}
