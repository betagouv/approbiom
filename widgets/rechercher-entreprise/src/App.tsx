import type { EntrepriseSearchPort } from '@shared/core/application/ports/entreprise-search'
import { createRechercheEntreprisesPort } from '@shared/infrastructure/referentiel-entreprise/recherche-entreprises-adapter'
import EntrepriseSearch from './components/EntrepriseSearch'

const PORTS: { entrepriseSearch: EntrepriseSearchPort } = {
    entrepriseSearch: createRechercheEntreprisesPort(),
}

export default function App() {
    return (
        <main className="rechercher-entreprise">
            <h1 className="fr-h6 fr-mb-0">Rechercher une entreprise</h1>
            <EntrepriseSearch
                getEntrepriseFromQuery={(query) =>
                    PORTS.entrepriseSearch.getEntrepriseFromQuery(query)
                }
            />
        </main>
    )
}
