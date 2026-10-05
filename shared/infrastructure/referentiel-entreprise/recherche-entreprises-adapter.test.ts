import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRechercheEntreprisesPort } from './recherche-entreprises-adapter'

// Fictional entreprises: neither the names nor the numbers exist.
const RESULT = {
    nom_complet: 'SCIERIE FICTIVE DU VALLON',
    siren: '000000003',
    siege: { siret: '00000000300010' },
    matching_etablissements: [
        { siret: '00000000300010' },
        { siret: '00000000300028' },
    ],
}

const result = (n: number) => ({
    nom_complet: `ENTREPRISE FICTIVE ${n}`,
    siege: { siret: `0000000000000${n}` },
})

function mockFetch(response: Response) {
    const fetch = vi.fn<(url: URL) => Promise<Response>>(() =>
        Promise.resolve(response)
    )
    vi.stubGlobal('fetch', fetch)
    return fetch
}

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    })

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('createRechercheEntreprisesPort().getEntrepriseFromQuery', () => {
    it('asks the API for the first 3 results of the query', async () => {
        const fetch = mockFetch(json({ results: [RESULT] }))

        await createRechercheEntreprisesPort().getEntrepriseFromQuery(
            'scierie & vallon'
        )

        const url = new URL(String(fetch.mock.calls[0][0]))
        expect(url.origin + url.pathname).toBe(
            'https://recherche-entreprises.api.gouv.fr/search'
        )
        expect(url.searchParams.get('q')).toBe('scierie & vallon')
        expect(url.searchParams.get('per_page')).toBe('3')
    })

    it('takes the dénomination from nom_complet and the SIRET of the siège', async () => {
        mockFetch(json({ results: [RESULT] }))

        expect(
            await createRechercheEntreprisesPort().getEntrepriseFromQuery(
                'scierie'
            )
        ).toEqual([
            {
                denomination: 'SCIERIE FICTIVE DU VALLON',
                siret: '00000000300010',
            },
        ])
    })

    it('gives back the établissement searched for by its SIRET', async () => {
        mockFetch(json({ results: [RESULT] }))

        const entreprises =
            await createRechercheEntreprisesPort().getEntrepriseFromQuery(
                '000 000 003 00028'
            )

        expect(entreprises[0].siret).toBe('00000000300028')
    })

    it('gives back no more than the first 3 results', async () => {
        mockFetch(json({ results: [1, 2, 3, 4].map(result) }))

        expect(
            await createRechercheEntreprisesPort().getEntrepriseFromQuery(
                'fictive'
            )
        ).toEqual(
            [1, 2, 3].map((n) => ({
                denomination: `ENTREPRISE FICTIVE ${n}`,
                siret: `0000000000000${n}`,
            }))
        )
    })

    it('finds nothing when the API has no result', async () => {
        mockFetch(json({ results: [], total_results: 0 }))

        expect(
            await createRechercheEntreprisesPort().getEntrepriseFromQuery(
                'introuvable'
            )
        ).toEqual([])
    })

    it("fails with the API's message when it refuses the query", async () => {
        mockFetch(
            json(
                {
                    erreur: '3 caractères minimum pour les termes de la requête (ou utilisez au moins un filtre)',
                },
                400
            )
        )

        await expect(
            createRechercheEntreprisesPort().getEntrepriseFromQuery('ab')
        ).rejects.toThrow(
            "La recherche d'entreprise a échoué (400) : 3 caractères minimum pour les termes de la requête (ou utilisez au moins un filtre)"
        )
    })

    it('fails with the status when the answer has no message', async () => {
        mockFetch(new Response('Bad Gateway', { status: 502 }))

        await expect(
            createRechercheEntreprisesPort().getEntrepriseFromQuery('scierie')
        ).rejects.toThrow("La recherche d'entreprise a échoué (502)")
    })
})
