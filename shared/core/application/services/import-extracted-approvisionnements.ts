import type { ApprovisionnementPort } from '@shared/core/application/ports/approvisionnement'
import type { ExtractedApprovisionnementPort } from '@shared/core/application/ports/extracted-approvisionnement'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import {
    toApprovisionnements,
    type ExtractedApprovisionnement,
} from '@shared/core/domain/entities/extracted-approvisionnement'

export type ImportExtractedApprovisionnementsPorts = {
    approvisionnements: Pick<ApprovisionnementPort, 'create'>
    extractedApprovisionnements: Pick<
        ExtractedApprovisionnementPort,
        'deleteLines'
    >
}

export class ApprovisionnementsNotCreatedError extends Error {}

export class ExtractedLinesNotDeletedError extends Error {
    constructor(readonly created: readonly Approvisionnement[]) {
        super('The approvisionnements were created, not the lines deleted.')
    }
}

export async function importExtractedApprovisionnements(
    lines: readonly ExtractedApprovisionnement[],
    plan: Approvisionnement['planDApprovisionnement'],
    source: Attachment['id'],
    {
        approvisionnements,
        extractedApprovisionnements,
    }: ImportExtractedApprovisionnementsPorts
): Promise<Approvisionnement[]> {
    const imported = lines.flatMap((line) =>
        toApprovisionnements(line, plan, source)
    )

    let created: Approvisionnement[]
    try {
        const ids = await approvisionnements.create(imported)
        created = imported.map((approvisionnement, index) => ({
            ...approvisionnement,
            id: ids[index],
        }))
    } catch (cause) {
        throw new ApprovisionnementsNotCreatedError(
            'No approvisionnement was created.',
            { cause }
        )
    }

    try {
        await extractedApprovisionnements.deleteLines(lines.map(({ id }) => id))
    } catch {
        throw new ExtractedLinesNotDeletedError(created)
    }

    return created
}
