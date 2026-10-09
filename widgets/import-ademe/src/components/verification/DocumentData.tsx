import { useId } from 'react'
import type { ExtractedLine } from '@shared/core/domain/entities/extracted-approvisionnement'

const TONNAGE = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

export type DocumentDataProps = {
    line: ExtractedLine
}

export default function DocumentData({ line }: DocumentDataProps) {
    const titleId = useId()
    const entries = [
        { label: 'Fournisseur', value: line.read.supplier },
        { label: 'Sous catégorie de combustible', value: line.read.resource },
        {
            label: 'Tonnage / an',
            value: `${TONNAGE.format(line.read.tonnage)} t`,
        },
        { label: 'Répartition par provenance', value: line.read.rawProvenance },
        { label: 'Données additionnelles', value: line.read.additionalData },
    ]

    return (
        <section
            className="review__section document-data"
            aria-labelledby={titleId}
        >
            <h3 id={titleId} className="fr-h6 fr-m-0">
                Données du document
            </h3>
            <dl className="review__list">
                {entries.map(({ label, value }) => (
                    <div key={label}>
                        <dt className="fr-text--xs fr-m-0 review__label">
                            {label}
                        </dt>
                        <dd className="fr-text--sm fr-m-0">{value || '—'}</dd>
                    </div>
                ))}
            </dl>
        </section>
    )
}
