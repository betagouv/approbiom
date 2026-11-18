import type { EntrepriseSearchPort } from '@shared/core/application/ports/entreprise-search'
import EntrepriseSearch from './components/EntrepriseSearch'

export type RechercherEntreprisePorts = {
    entrepriseSearch: EntrepriseSearchPort
}

export default function App({ entrepriseSearch }: RechercherEntreprisePorts) {
    return (
        <main className="widget-rechercher-entreprise">
            <h1 className="fr-h6 fr-mb-0">Rechercher une entreprise</h1>
            <EntrepriseSearch
                getEntrepriseFromQuery={(query) =>
                    entrepriseSearch.getEntrepriseFromQuery(query)
                }
            />
        </main>
    )
}
