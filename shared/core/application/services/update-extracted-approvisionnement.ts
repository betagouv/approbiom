import type {
    ExtractedApprovisionnementPort,
    ExtractedLineChanges,
} from '@shared/core/application/ports/extracted-approvisionnement'
import {
    isVerifiable,
    type ExtractedApprovisionnement,
} from '@shared/core/domain/entities/extracted-approvisionnement'
import {
    NON_VERIFIEE,
    VERIFIEE,
} from '@shared/core/domain/value-objects/extracted-approvisionnement-controle'

export async function updateExtractedApprovisionnement(
    line: ExtractedApprovisionnement,
    { controle, ...changes }: ExtractedLineChanges,
    extractedApprovisionnements: Pick<ExtractedApprovisionnementPort, 'update'>
): Promise<ExtractedApprovisionnement> {
    const derived = { ...line.derived, ...changes }
    const nextControle =
        controle ??
        (isVerifiable({ read: line.read, derived }) ? VERIFIEE : NON_VERIFIEE)

    await extractedApprovisionnements.update(line.id, {
        ...changes,
        controle: nextControle,
    })

    return { ...line, controle: nextControle, derived }
}
