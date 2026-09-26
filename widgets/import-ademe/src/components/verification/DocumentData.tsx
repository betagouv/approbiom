import { useId } from 'react'
import type { ImportedLines } from '@shared/infrastructure/import-bcib-bciat/helpers'

const TONNAGE = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

export type DocumentDataProps = {
    line: ImportedLines
}

export default function DocumentData({ line }: DocumentDataProps) {
    const titleId = useId()
    const entries = [
        { label: 'Fournisseur', value: line.supplier },
        { label: 'Sous catégorie de combustible', value: line.resource },
        { label: 'Tonnage / an', value: `${TONNAGE.format(line.tonnage)} t` },
        { label: 'Répartition par provenance', value: line.rawProvenance },
        { label: 'Données additionnelles', value: line.additionalData },
    ]

    return (
        <section
            className="review__section document-data"
            aria-labelledby={titleId}
        >
            <h3 id={titleId} className="fr-text--xs fr-m-0 review__title">
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
