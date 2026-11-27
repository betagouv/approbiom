import type {
    EntrepriseSearchPort,
    EtatAdministratif,
    FoundEntreprise,
} from '@shared/core/application/ports/entreprise-search'

// see https://recherche-entreprises.api.gouv.fr/docs/
const SEARCH_URL = 'https://recherche-entreprises.api.gouv.fr/search'

const RESULT_COUNT = 3

// The API caps total_results at 10 000: that value means "10 000 or more".
const TOTAL_CEILING = 10_000

type Etablissement = {
    siret: string
    // A: actif, F: fermé.
    etat_administratif: 'A' | 'F'
    // Null while still open.
    date_fermeture: string | null
    adresse: string
}

type SearchResult = {
    nom_complet: string
    // Of the unité légale. A: active, C: cessée.
    etat_administratif: 'A' | 'C'
    date_fermeture: string | null
    siege: Etablissement
    matching_etablissements?: Etablissement[]
}

type SearchResponse = {
    results: SearchResult[]
    // Documented as always sent; guarded so the total is never NaN.
    total_results?: number
}

function etablissementOf(result: SearchResult, query: string): Etablissement {
    const digits = query.replace(/\s/g, '')
    const searchedEtablissement = result.matching_etablissements?.find(
        ({ siret }) => siret === digits
    )

    return searchedEtablissement ?? result.siege
}

function etatOf(
    result: SearchResult,
    etablissement: Etablissement
): EtatAdministratif {
    if (result.etat_administratif === 'C')
        return { etat: 'cessee', depuis: result.date_fermeture }
    if (etablissement.etat_administratif === 'F')
        return {
            etat: 'etablissement-ferme',
            depuis: etablissement.date_fermeture,
        }

    return { etat: 'en-activite' }
}

function toEntreprise(result: SearchResult, query: string): FoundEntreprise {
    const etablissement = etablissementOf(result, query)

    return {
        denomination: result.nom_complet,
        siret: etablissement.siret,
        etatAdministratif: etatOf(result, etablissement),
        adresse: etablissement.adresse,
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

            const { results, total_results } =
                (await response.json()) as SearchResponse
            const count = total_results ?? results.length

            return {
                entreprises: results
                    .slice(0, RESULT_COUNT)
                    .map((result) => toEntreprise(result, query)),
                total: { count, atLeast: count >= TOTAL_CEILING },
            }
        },
    }
}
