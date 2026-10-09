import { PAYS_ETRANGER } from '@shared/core/domain/value-objects/provenance'
import { formatNumber } from '@shared/react/format'
import type { ExtractedLine } from '@shared/core/domain/entities/extracted-approvisionnement'

export type DistributionListProps = {
    line: ExtractedLine
    departementLabels: ReadonlyMap<string, string>
}

export default function DistributionList({
    line,
    departementLabels,
}: DistributionListProps) {
    const { distribution } = line.derived.parsedProvenance

    if (distribution.length === 0)
        return (
            <p className="fr-m-0 verification__mention">
                Aucune provenance trouvée.
            </p>
        )

    return (
        <ul className="verification__distribution">
            {distribution.map(({ source, provenance, percentage }, index) => (
                <li key={index}>
                    {source === PAYS_ETRANGER
                        ? provenance
                        : (departementLabels.get(provenance) ??
                          provenance)}{' '}
                    : {formatNumber(percentage)} % ·{' '}
                    {formatNumber((line.read.tonnage * percentage) / 100)}
                    {' '}t MV/an
                </li>
            ))}
        </ul>
    )
}
