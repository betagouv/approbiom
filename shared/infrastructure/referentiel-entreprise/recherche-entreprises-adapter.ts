import type {
    EntrepriseSearchPort,
    EtatAdministratif,
    FoundEntreprise,
} from '@shared/core/application/ports/entreprise-search'

// see https://recherche-entreprises.api.gouv.fr/docs/
const SEARCH_URL = 'https://recherche-entreprises.api.gouv.fr/search'

// Only the first answers are shown.
const RESULT_COUNT = 3

// The fields read from the answer; the API sends many more.
type Etablissement = {
    siret: string
    // A: actif, F: fermé.
    etat_administratif: 'A' | 'F'
    // Always sent, here as on the unité légale: null while still open.
    date_fermeture: string | null
    adresse: string
}

type SearchResult = {
    nom_complet: string
    // That of the unité légale — A: active, C: cessée.
    etat_administratif: 'A' | 'C'
    date_fermeture: string | null
    siege: Etablissement
    matching_etablissements?: Etablissement[]
}

type SearchResponse = { results: SearchResult[] }

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

            const { results } = (await response.json()) as SearchResponse

            return results
                .slice(0, RESULT_COUNT)
                .map((result) => toEntreprise(result, query))
        },
    }
}
