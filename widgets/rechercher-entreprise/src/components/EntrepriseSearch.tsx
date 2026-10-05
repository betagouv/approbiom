import './EntrepriseSearch.css'

import { useState } from 'react'
import Alert from '@shared/react/components/Alert'
import SearchBar from '@shared/react/components/SearchBar'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import EntrepriseResult from './EntrepriseResult'

type SearchStatus =
    | { kind: 'idle' }
    | { kind: 'loading' }
    | { kind: 'found'; entreprise: Entreprise }
    | { kind: 'not-found'; query: string }
    | { kind: 'failed' }

export type EntrepriseSearchProps = {
    getEntrepriseFromQuery: (query: string) => Promise<Entreprise | null>
}

export default function EntrepriseSearch({
    getEntrepriseFromQuery,
}: EntrepriseSearchProps) {
    const [status, setStatus] = useState<SearchStatus>({ kind: 'idle' })

    async function search(query: string) {
        const terms = query.trim()
        if (terms === '') return

        setStatus({ kind: 'loading' })
        try {
            const entreprise = await getEntrepriseFromQuery(terms)

            setStatus(
                entreprise
                    ? { kind: 'found', entreprise }
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
                {status.kind === 'loading' && (
                    <p className="fr-text--sm fr-m-0">Recherche en cours…</p>
                )}
                {status.kind === 'found' && (
                    <EntrepriseResult entreprise={status.entreprise} />
                )}
                {status.kind === 'not-found' && (
                    <p className="fr-m-0">
                        Aucune entreprise ne correspond à « {status.query} ».
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
