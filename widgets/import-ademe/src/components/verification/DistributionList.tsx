import type { DepartementsByRegion } from '@shared/core/application/ports/referentiel-geo'
import type { ExtractedLine } from '@shared/core/domain/entities/extracted-approvisionnement'

const NUMBER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

export function departementLabelsOf(
    departementsByRegion: readonly DepartementsByRegion[]
): ReadonlyMap<string, string> {
    return new Map(
        departementsByRegion.flatMap(({ departements }) =>
            departements.map(({ dep, libelle }) => [dep, `${libelle} (${dep})`])
        )
    )
}

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
                    {source === 'Pays étranger'
                        ? provenance
                        : (departementLabels.get(provenance) ??
                          provenance)}{' '}
                    : {NUMBER.format(percentage)} % ·{' '}
                    {NUMBER.format((line.read.tonnage * percentage) / 100)}{' '}
                    tonnes MV/an
                </li>
            ))}
        </ul>
    )
}
