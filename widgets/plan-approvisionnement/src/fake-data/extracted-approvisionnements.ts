import type { ExtractedApprovisionnementPort } from '@shared/core/application/ports/extracted-approvisionnement'
import {
    NON_VERIFIEE,
    VERIFIEE,
} from '@shared/core/domain/value-objects/extracted-approvisionnement-controle'
import type { ExtractedApprovisionnement } from '@shared/core/domain/entities/extracted-approvisionnement'

// Stands in for the table « Approvisionnement extrait d'un document », in
// memory: it lasts as long as the page.
export function createFakeExtractedApprovisionnements(): ExtractedApprovisionnementPort {
    const rows = new Map<number, ExtractedApprovisionnement[]>()
    let nextId = 1

    return {
        listByDocument: (attachment) =>
            Promise.resolve(
                (rows.get(attachment.id) ?? []).map((row) => ({
                    ...row,
                    read: { ...row.read, document: attachment.name },
                }))
            ),
        // A document whose lines were all imported has none left.
        listSummaries: () =>
            Promise.resolve(
                [...rows]
                    .filter(([, lines]) => lines.length > 0)
                    .map(([attachmentId, lines]) => ({
                        attachmentId,
                        extractedAt: lines[0].extractedAt,
                        lineCount: lines.length,
                        verifiedCount: lines.filter(
                            ({ controle }) => controle === VERIFIEE
                        ).length,
                    }))
            ),
        create: (attachment, lines, extractedAt) => {
            rows.set(attachment.id, [
                ...(rows.get(attachment.id) ?? []),
                ...lines.map((line) => ({
                    ...line,
                    id: nextId++,
                    controle: NON_VERIFIEE,
                    extractedAt,
                })),
            ])

            return Promise.resolve()
        },
        update: (id, { controle, ...derived }) => {
            for (const [attachmentId, lines] of rows)
                rows.set(
                    attachmentId,
                    lines.map((line) =>
                        line.id === id
                            ? {
                                  ...line,
                                  controle: controle ?? line.controle,
                                  derived: { ...line.derived, ...derived },
                              }
                            : line
                    )
                )

            return Promise.resolve()
        },
        deleteByDocument: (attachment) => {
            rows.delete(attachment.id)

            return Promise.resolve()
        },
        deleteLines: (ids) => {
            for (const [attachmentId, lines] of rows)
                rows.set(
                    attachmentId,
                    lines.filter(({ id }) => !ids.includes(id))
                )

            return Promise.resolve()
        },
    }
}
