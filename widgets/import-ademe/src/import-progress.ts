import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { ApprovisionnementPort } from '@shared/core/application/ports/approvisionnement'
import type {
    ExtractedApprovisionnementPort,
    ExtractionSummary,
} from './extracted-approvisionnement-port'

export type ImportProgress = {
    extractions: ReadonlyMap<Attachment['id'], ExtractionSummary>
    approvisionnementCounts: ReadonlyMap<
        Approvisionnement['planDApprovisionnement'],
        number
    >
}

export async function loadImportProgress(ports: {
    extractedApprovisionnements: Pick<
        ExtractedApprovisionnementPort,
        'listSummaries'
    >
    approvisionnements: Pick<ApprovisionnementPort, 'list'>
}): Promise<ImportProgress> {
    const [summaries, approvisionnements] = await Promise.all([
        ports.extractedApprovisionnements.listSummaries(),
        ports.approvisionnements.list(),
    ])

    const approvisionnementCounts = new Map<number, number>()
    for (const { planDApprovisionnement } of approvisionnements)
        approvisionnementCounts.set(
            planDApprovisionnement,
            (approvisionnementCounts.get(planDApprovisionnement) ?? 0) + 1
        )

    return {
        extractions: new Map(
            summaries.map((summary) => [summary.attachmentId, summary])
        ),
        approvisionnementCounts,
    }
}
