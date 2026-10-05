import '@gouvfr/dsfr/dist/component/link/link.main.min.css'

import { annuaireSearchUrl } from '../annuaire-entreprises'

export type AnnuaireSearchLinkProps = {
    query: string
}

export default function AnnuaireSearchLink({ query }: AnnuaireSearchLinkProps) {
    return (
        <a
            className="fr-link"
            href={annuaireSearchUrl(query)}
            target="_blank"
            rel="noopener noreferrer"
            title={`Chercher « ${query} » sur l'Annuaire des Entreprises - nouvelle fenêtre`}
        >
            Chercher sur l&apos;Annuaire des Entreprises
        </a>
    )
}
