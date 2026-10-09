import type {
    ExtractedApprovisionnementPort,
    ExtractedLineChanges,
} from '@shared/core/application/ports/extracted-approvisionnement'
import type { ExtractedApprovisionnement } from '@shared/core/domain/entities/extracted-approvisionnement'
import {
    NON_VERIFIEE,
    VERIFIEE,
} from '@shared/core/domain/value-objects/extracted-approvisionnement-controle'

export async function updateExtractedApprovisionnement(
    line: ExtractedApprovisionnement,
    { controle, ...derived }: ExtractedLineChanges,
    extractedApprovisionnements: Pick<ExtractedApprovisionnementPort, 'update'>
): Promise<ExtractedApprovisionnement> {
    const nextControle =
        controle ?? (line.controle === VERIFIEE ? NON_VERIFIEE : undefined)

    await extractedApprovisionnements.update(line.id, {
        ...derived,
        ...(nextControle && { controle: nextControle }),
    })

    return {
        ...line,
        controle: nextControle ?? line.controle,
        derived: { ...line.derived, ...derived },
    }
}
