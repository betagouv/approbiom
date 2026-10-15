import '@gouvfr/dsfr/dist/component/link/link.main.min.css'

import type { ReactNode } from 'react'
import CopyButton from '@shared/react/components/CopyButton'
import type { FoundEntreprise } from '@shared/core/application/ports/entreprise-search'
import { annuaireEntrepriseUrl } from '@shared/infrastructure/referentiel-entreprise/annuaire-entreprises'
import EtatAdministratifBadge from './EtatAdministratifBadge'

export type EntrepriseResultProps = {
    entreprise: FoundEntreprise
}

function Entry({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="entreprise-result__entry">
            <dt className="fr-text--sm fr-m-0 entreprise-result__label">
                {label}
            </dt>
            <dd className="fr-m-0 entreprise-result__value">{children}</dd>
        </div>
    )
}

function CopyableEntry({
    label,
    value,
    copyLabel,
}: {
    label: string
    value: string
    copyLabel: string
}) {
    return (
        <Entry label={label}>
            <span>{value}</span>
            <CopyButton value={value} label={copyLabel} />
        </Entry>
    )
}

export default function EntrepriseResult({
    entreprise,
}: EntrepriseResultProps) {
    const { denomination, siret, etatAdministratif, adresse } = entreprise

    return (
        <div className="entreprise-result">
            <dl className="entreprise-result__list">
                <CopyableEntry
                    label="Dénomination"
                    value={denomination}
                    copyLabel={`la dénomination de ${denomination}`}
                />
                <Entry label="État administratif">
                    <EtatAdministratifBadge
                        etatAdministratif={etatAdministratif}
                    />
                </Entry>
                <CopyableEntry
                    label="SIRET"
                    value={siret}
                    copyLabel={`le SIRET de ${denomination}`}
                />
                <CopyableEntry
                    label="Adresse"
                    value={adresse}
                    copyLabel={`l'adresse de ${denomination}`}
                />
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
