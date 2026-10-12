import type { ApprovisionnementPort } from '@shared/core/application/ports/approvisionnement'
import type { Attachment } from '@shared/core/domain/entities/attachment'

export type CountImportedApprovisionnementsPorts = {
    approvisionnements: Pick<ApprovisionnementPort, 'list'>
}

export async function countImportedApprovisionnementsByDocument({
    approvisionnements,
}: CountImportedApprovisionnementsPorts): Promise<
    ReadonlyMap<Attachment['id'], number>
> {
    const counts = new Map<Attachment['id'], number>()

    for (const { source } of await approvisionnements.list()) {
        if (source === undefined) continue
        counts.set(source, (counts.get(source) ?? 0) + 1)
    }

    return counts
}
