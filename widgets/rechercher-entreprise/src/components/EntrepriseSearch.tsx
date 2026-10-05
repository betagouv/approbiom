import './EntrepriseSearch.css'

import { useId, useState } from 'react'
import Alert from '@shared/react/components/Alert'
import SearchBar from '@shared/react/components/SearchBar'
import type { FoundEntreprise } from '@shared/core/application/ports/entreprise-search'
import AnnuaireSearchLink from './AnnuaireSearchLink'
import EntrepriseResult from './EntrepriseResult'

// The API refuses shorter queries.
const MIN_QUERY_LENGTH = 3

type SearchStatus =
    | { kind: 'idle' }
    | { kind: 'too-short' }
    | { kind: 'loading' }
    | { kind: 'found'; query: string; entreprises: FoundEntreprise[] }
    | { kind: 'not-found'; query: string }
    | { kind: 'failed' }

export type EntrepriseSearchProps = {
    getEntrepriseFromQuery: (query: string) => Promise<FoundEntreprise[]>
}

export default function EntrepriseSearch({
    getEntrepriseFromQuery,
}: EntrepriseSearchProps) {
    const resultsTitleId = useId()
    const [status, setStatus] = useState<SearchStatus>({ kind: 'idle' })

    async function search(query: string) {
        const terms = query.trim()
        if (terms === '') return
        if (terms.length < MIN_QUERY_LENGTH) {
            setStatus({ kind: 'too-short' })
            return
        }

        setStatus({ kind: 'loading' })
        try {
            const entreprises = await getEntrepriseFromQuery(terms)

            setStatus(
                entreprises.length > 0
                    ? { kind: 'found', query: terms, entreprises }
                    : { kind: 'not-found', query: terms }
            )
        } catch {
            setStatus({ kind: 'failed' })
        }
    }

    return (
        <div className="entreprise-search">
            <SearchBar
                label="Entreprise"
                showLabel
                hint="Termes pour une recherche textuelle (dénomination et/ou adresse, dirigeants, élus) ou recherche directe (SIREN, SIRET)."
                onSearch={(query) => void search(query)}
            />

            <div aria-live="polite">
                {status.kind === 'too-short' && (
                    <p className="fr-m-0">
                        Saisissez au moins {MIN_QUERY_LENGTH} caractères.
                    </p>
                )}
                {status.kind === 'loading' && (
                    <p className="fr-text--sm fr-m-0">Recherche en cours…</p>
                )}
                {status.kind === 'found' && (
                    <section aria-labelledby={resultsTitleId}>
                        <h2 id={resultsTitleId} className="fr-h6 fr-mb-1w">
                            {status.entreprises.length > 1
                                ? `${status.entreprises.length} entreprises trouvées`
                                : '1 entreprise trouvée'}
                        </h2>
                        <p className="fr-mb-2w">
                            <AnnuaireSearchLink query={status.query} />
                        </p>
                        <ol className="fr-raw-list entreprise-search__results">
                            {status.entreprises.map((entreprise) => (
                                <li key={entreprise.siret}>
                                    <EntrepriseResult entreprise={entreprise} />
                                </li>
                            ))}
                        </ol>
                    </section>
                )}
                {status.kind === 'not-found' && (
                    <p className="fr-m-0">
                        Aucune entreprise ne correspond à « {status.query} ».{' '}
                        <AnnuaireSearchLink query={status.query} />
                    </p>
                )}
                {status.kind === 'failed' && (
                    <Alert severity="error">
                        La recherche a échoué. Réessayez.
                    </Alert>
                )}
            </div>
        </div>
    )
}
