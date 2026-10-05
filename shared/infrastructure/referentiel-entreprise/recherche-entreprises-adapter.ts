import type {
    EntrepriseSearchPort,
    FoundEntreprise,
} from '@shared/core/application/ports/entreprise-search'

// see https://recherche-entreprises.api.gouv.fr/docs/
const SEARCH_URL = 'https://recherche-entreprises.api.gouv.fr/search'

// Only the first answers are shown.
const RESULT_COUNT = 3

// The fields read from the answer; the API sends many more.
type SearchResult = {
    nom_complet: string
    siege: { siret: string }
    matching_etablissements?: { siret: string }[]
}

type SearchResponse = { results: SearchResult[] }

function siretOf(result: SearchResult, query: string): string {
    const digits = query.replace(/\s/g, '')
    const searchedEtablissement = result.matching_etablissements?.find(
        ({ siret }) => siret === digits
    )

    return searchedEtablissement?.siret ?? result.siege.siret
}

function toEntreprise(result: SearchResult, query: string): FoundEntreprise {
    return {
        denomination: result.nom_complet,
        siret: siretOf(result, query),
    }
}

async function errorOf(response: Response): Promise<Error> {
    const body = (await response.json().catch(() => null)) as {
        erreur?: string
    } | null

    return new Error(
        `La recherche d'entreprise a échoué (${response.status})${body?.erreur ? ` : ${body.erreur}` : ''}`
    )
}

export function createRechercheEntreprisesPort(): EntrepriseSearchPort {
    return {
        async getEntrepriseFromQuery(query) {
            const url = new URL(SEARCH_URL)
            url.searchParams.set('q', query)
            url.searchParams.set('per_page', String(RESULT_COUNT))

            const response = await fetch(url)
            if (!response.ok) throw await errorOf(response)

            const { results } = (await response.json()) as SearchResponse

            return results
                .slice(0, RESULT_COUNT)
                .map((result) => toEntreprise(result, query))
        },
    }
}
