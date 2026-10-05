import type { EntrepriseSearchPort } from '@shared/core/application/ports/entreprise-search'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'

// Fictional entreprises: neither the names nor the SIRETs exist.
const FAKE_ENTREPRISES: readonly Entreprise[] = [
    { denomination: 'BOIS FICTIF ENERGIE', siret: '00000000000001' },
    { denomination: 'COOPERATIVE FICTIVE DES FORETS', siret: '00000000000002' },
    { denomination: 'SCIERIE FICTIVE DU VALLON', siret: '00000000000003' },
    { denomination: 'GRANULES FICTIFS DU PLATEAU', siret: '00000000000004' },
]

const searchable = (text: string) =>
    text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()

// A SIREN is the first 9 digits of a SIRET: either finds the entreprise.
function matches(entreprise: Entreprise, query: string): boolean {
    const digits = query.replace(/\s/g, '')
    if (/^\d{9}(\d{5})?$/.test(digits))
        return entreprise.siret.startsWith(digits)

    return searchable(entreprise.denomination).includes(searchable(query))
}

export const FAKE_ENTREPRISE_SEARCH: EntrepriseSearchPort = {
    getEntrepriseFromQuery: (query) =>
        new Promise((resolve) =>
            setTimeout(
                () =>
                    resolve(
                        FAKE_ENTREPRISES.find((entreprise) =>
                            matches(entreprise, query)
                        ) ?? null
                    ),
                300
            )
        ),
}
