import type {
    ExtractedApprovisionnementPort,
    ExtractedApprovisionnement,
} from '../extracted-approvisionnement-port'
import {
    NON_VERIFIEE,
    VERIFIEE,
} from '@shared/core/domain/value-objects/extracted-approvisionnement-controle'
import type { ExtractedLine } from '@shared/core/domain/entities/extracted-approvisionnement'

// Stands in for the table « Approvisionnement extrait d'un document », in
// memory: it lasts as long as the page. `isCreated` stands in for the Grist
// formula that tells a created line apart.
export function createFakeExtractedApprovisionnements(
    isCreated: (line: ExtractedLine) => boolean = () => false
): ExtractedApprovisionnementPort {
    const rows = new Map<number, ExtractedApprovisionnement[]>()
    let nextId = 1

    return {
        listByDocument: (attachment) =>
            Promise.resolve(
                (rows.get(attachment.id) ?? []).map((row) => ({
                    ...row,
                    controle: isCreated(row) ? VERIFIEE : row.controle,
                    read: { ...row.read, document: attachment.name },
                }))
            ),
        listSummaries: () =>
            Promise.resolve(
                [...rows].map(([attachmentId, lines]) => ({
                    attachmentId,
                    extractedAt: lines[0].extractedAt,
                    lineCount: lines.length,
                    verifiedCount: lines.filter(isCreated).length,
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
        deleteByDocument: (attachment) => {
            rows.delete(attachment.id)

            return Promise.resolve()
        },
        deleteLines: () => Promise.resolve(),
    }
}
