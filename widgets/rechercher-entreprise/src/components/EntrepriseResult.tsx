import { useId } from 'react'
import CopyButton from '@shared/react/components/CopyButton'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'

export type EntrepriseResultProps = {
    entreprise: Entreprise
}

export default function EntrepriseResult({
    entreprise,
}: EntrepriseResultProps) {
    const titleId = useId()
    const entries = [
        {
            label: 'Dénomination',
            value: entreprise.denomination,
            copyLabel: 'la dénomination',
        },
        { label: 'SIRET', value: entreprise.siret, copyLabel: 'le SIRET' },
    ]

    return (
        <section className="entreprise-result" aria-labelledby={titleId}>
            <h2 id={titleId} className="fr-h6 fr-mb-2w">
                Entreprise trouvée
            </h2>
            <dl className="entreprise-result__list">
                {entries.map(({ label, value, copyLabel }) => (
                    <div key={label} className="entreprise-result__entry">
                        <dt className="fr-text--sm fr-m-0 entreprise-result__label">
                            {label}
                        </dt>
                        <dd className="fr-m-0 entreprise-result__value">
                            <span>{value}</span>
                            <CopyButton value={value} label={copyLabel} />
                        </dd>
                    </div>
                ))}
            </dl>
        </section>
    )
}
