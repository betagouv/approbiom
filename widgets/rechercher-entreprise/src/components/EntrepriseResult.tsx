import '@gouvfr/dsfr/dist/component/link/link.main.min.css'

import CopyButton from '@shared/react/components/CopyButton'
import type { FoundEntreprise } from '@shared/core/application/ports/entreprise-search'
import { annuaireEntrepriseUrl } from '../annuaire-entreprises'

export type EntrepriseResultProps = {
    entreprise: FoundEntreprise
}

export default function EntrepriseResult({
    entreprise,
}: EntrepriseResultProps) {
    const { denomination, siret } = entreprise

    const entries = [
        {
            label: 'Dénomination',
            value: denomination,
            copyLabel: `la dénomination de ${denomination}`,
        },
        {
            label: 'SIRET',
            value: siret,
            copyLabel: `le SIRET de ${denomination}`,
        },
    ]

    return (
        <div className="entreprise-result">
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
            <a
                className="fr-link fr-link--sm"
                href={annuaireEntrepriseUrl(entreprise)}
                target="_blank"
                rel="noopener noreferrer"
                title={`Plus de détails sur ${denomination} dans la page de l'Annuaire des Entreprises - nouvelle fenêtre`}
            >
                Plus de détails sur l&apos;entreprise dans la page de
                l&apos;Annuaire des Entreprises
            </a>
        </div>
    )
}
