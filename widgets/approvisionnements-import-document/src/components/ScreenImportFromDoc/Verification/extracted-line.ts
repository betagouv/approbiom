import {
    distributionTotal,
    type ExtractedLine,
} from '@shared/core/domain/entities/extracted-approvisionnement'
import { formatNumber, plural } from '@shared/react/format'

export function distributionSummary(line: ExtractedLine): string {
    const { distribution } = line.derived.parsedProvenance
    if (distribution.length === 0) return 'Aucune provenance'

    return `${plural(distribution.length, 'provenance')} · ${formatNumber(distributionTotal(line))} %`
}
