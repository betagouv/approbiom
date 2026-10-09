import {
    distributionTotal,
    type ExtractedLine,
} from '@shared/core/domain/entities/extracted-approvisionnement'

const NUMBER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

const plural = (count: number, word: string) =>
    `${count} ${word}${count > 1 ? 's' : ''}`

export function distributionSummary(line: ExtractedLine): string {
    const { distribution } = line.derived.parsedProvenance
    if (distribution.length === 0) return 'Aucune provenance'

    return `${plural(distribution.length, 'provenance')} · ${NUMBER.format(distributionTotal(line))} %`
}

export const formatPercentage = (value: number) => NUMBER.format(value)
