import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
    within,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type {
    EntrepriseSearchResult,
    FoundEntreprise,
} from '@shared/core/application/ports/entreprise-search'
import EntrepriseSearch from './EntrepriseSearch'

const ENTREPRISES: FoundEntreprise[] = [
    {
        denomination: 'SCIERIE FICTIVE DU VALLON',
        siret: '00000000000003',
        etatAdministratif: { etat: 'en-activite' },
        adresse: '1 RUE FICTIVE 00000 VALLON-FICTIF',
    },
    {
        denomination: 'SCIERIE FICTIVE DU PLATEAU',
        siret: '00000000000004',
        etatAdministratif: { etat: 'cessee', depuis: '2003-04-01' },
        adresse: '2 CHEMIN FICTIF 00000 PLATEAU-FICTIF',
    },
]

// A search answering these entreprises, out of `total` in all — by default,
// just them.
const searchFinding = (
    entreprises: FoundEntreprise[],
    total = { count: entreprises.length, atLeast: false }
) =>
    vi.fn((): Promise<EntrepriseSearchResult> =>
        Promise.resolve({ entreprises, total })
    )

afterEach(cleanup)

async function searchFor(
    query: string,
    getEntrepriseFromQuery = searchFinding(ENTREPRISES)
) {
    render(<EntrepriseSearch getEntrepriseFromQuery={getEntrepriseFromQuery} />)
    fireEvent.change(screen.getByRole('searchbox', { name: /^Entreprise/ }), {
        target: { value: query },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Rechercher' }))
    await act(() => Promise.resolve())

    return getEntrepriseFromQuery
}

describe('EntrepriseSearch', () => {
    it('searches the terms typed, without the surrounding spaces', async () => {
        const getEntrepriseFromQuery = await searchFor('  scierie vallon ')

        expect(getEntrepriseFromQuery).toHaveBeenCalledWith('scierie vallon')
    })

    it('lists each entreprise found, with its dénomination and SIRET', async () => {
        await searchFor('scierie')

        const results = screen.getByRole('region', {
            name: '2 entreprises trouvées',
        })
        expect(
            [...results.querySelectorAll('li')].map((item) => item.textContent)
        ).toEqual([
            expect.stringContaining('SCIERIE FICTIVE DU VALLON'),
            expect.stringContaining('SCIERIE FICTIVE DU PLATEAU'),
        ])
        expect(results.textContent).toContain('00000000000003')
        expect(results.textContent).toContain('00000000000004')
    })

    it('gives the address of each entreprise found', async () => {
        await searchFor('scierie')

        const results = screen.getByRole('region', {
            name: '2 entreprises trouvées',
        })
        expect(results.textContent).toContain(
            '1 RUE FICTIVE 00000 VALLON-FICTIF'
        )
        expect(results.textContent).toContain(
            '2 CHEMIN FICTIF 00000 PLATEAU-FICTIF'
        )
        expect(
            screen.getByRole('button', {
                name: "Copier l'adresse de SCIERIE FICTIVE DU VALLON",
            })
        ).toBeDefined()
    })

    it('says which entreprise is still active and which has ceased, and since when', async () => {
        await searchFor('scierie')

        const [vallon, plateau] = screen.getAllByRole('listitem')
        expect(within(vallon).getByText('En activité')).toBeDefined()
        expect(within(plateau).getByText('Cessée le 01/04/2003')).toBeDefined()
    })

    it('says the entreprise has ceased, even when SIRENE does not know since when', async () => {
        await searchFor(
            'vallon',
            searchFinding([
                {
                    ...ENTREPRISES[0],
                    etatAdministratif: { etat: 'cessee', depuis: null },
                },
            ])
        )

        expect(screen.getByText('Cessée')).toBeDefined()
    })

    it('leaves out a closing date it cannot read', async () => {
        await searchFor(
            'vallon',
            searchFinding([
                {
                    ...ENTREPRISES[0],
                    etatAdministratif: { etat: 'cessee', depuis: '2003' },
                },
            ])
        )

        expect(screen.getByText('Cessée')).toBeDefined()
    })

    it('says when the établissement found has closed, though its entreprise is active', async () => {
        await searchFor(
            '00000000000003',
            searchFinding([
                {
                    ...ENTREPRISES[0],
                    etatAdministratif: {
                        etat: 'etablissement-ferme',
                        depuis: '2023-07-01',
                    },
                },
            ])
        )

        expect(
            screen.getByText('Établissement fermé le 01/07/2023')
        ).toBeDefined()
    })

    it('says how many more entreprises match than are listed', async () => {
        await searchFor(
            'scierie',
            searchFinding(ENTREPRISES, { count: 57, atLeast: false })
        )

        const results = screen.getByRole('region', {
            name: '57 entreprises trouvées',
        })
        expect(results.querySelectorAll('li')).toHaveLength(2)
        expect(
            within(results).getByText(
                '55 autres entreprises ne sont pas affichées.'
            )
        ).toBeDefined()
    })

    it('says when a single entreprise is left out', async () => {
        await searchFor(
            'scierie',
            searchFinding(ENTREPRISES, { count: 3, atLeast: false })
        )

        expect(
            screen.getByText("1 autre entreprise n'est pas affichée.")
        ).toBeDefined()
    })

    it('says there are at least as many when the search stops counting', async () => {
        await searchFor(
            'sarl',
            searchFinding(ENTREPRISES, { count: 10000, atLeast: true })
        )

        // fr-FR groups thousands with a narrow no-break space, which \s
        // matches.
        expect(
            screen.getByRole('region', {
                name: /^Au moins 10\s000 entreprises trouvées$/,
            })
        ).toBeDefined()
        expect(
            screen.getByText(
                /^Au moins 9\s998 autres entreprises ne sont pas affichées\.$/
            )
        ).toBeDefined()
    })

    it('says nothing of other entreprises when all of them are listed', async () => {
        await searchFor('scierie')

        expect(screen.queryByText(/pas affichée/)).toBeNull()
    })

    it('says whose value each copy button copies', async () => {
        await searchFor('scierie')

        expect(
            screen.getByRole('button', {
                name: 'Copier la dénomination de SCIERIE FICTIVE DU VALLON',
            })
        ).toBeDefined()
        expect(
            screen.getByRole('button', {
                name: 'Copier le SIRET de SCIERIE FICTIVE DU PLATEAU',
            })
        ).toBeDefined()
    })

    it('links each entreprise to its page on the Annuaire des Entreprises', async () => {
        await searchFor('scierie')

        const links = screen.getAllByRole('link', {
            name: /Plus de détails sur l'entreprise dans la page de l'Annuaire des Entreprises/,
        })
        expect(links.map((link) => link.getAttribute('href'))).toEqual([
            'https://annuaire-entreprises.data.gouv.fr/entreprise/scierie-fictive-du-vallon-000000000',
            'https://annuaire-entreprises.data.gouv.fr/entreprise/scierie-fictive-du-plateau-000000000',
        ])
        expect(links[0].getAttribute('target')).toBe('_blank')
    })

    it('offers to search the Annuaire des Entreprises below the results', async () => {
        await searchFor('scierie')

        const results = screen.getByRole('region', {
            name: '2 entreprises trouvées',
        })
        const link = within(results).getByRole('link', {
            name: /Chercher sur l'Annuaire des Entreprises/,
        })
        expect(link.getAttribute('href')).toBe(
            'https://annuaire-entreprises.data.gouv.fr/rechercher?terme=scierie'
        )
        expect(link.getAttribute('target')).toBe('_blank')
    })

    it('says « 1 entreprise trouvée » for a single result', async () => {
        await searchFor('vallon', searchFinding([ENTREPRISES[0]]))

        expect(
            screen.getByRole('region', { name: '1 entreprise trouvée' })
        ).toBeDefined()
    })

    it('says when nothing matches, with a link to the Annuaire des Entreprises', async () => {
        await searchFor('scierie introuvable', searchFinding([]))

        expect(
            screen.getByText(
                /Aucune entreprise ne correspond à « scierie introuvable »/
            )
        ).toBeDefined()
        const link = screen.getByRole('link', {
            name: /Chercher sur l'Annuaire des Entreprises/,
        })
        expect(link.getAttribute('href')).toBe(
            'https://annuaire-entreprises.data.gouv.fr/rechercher?terme=scierie+introuvable'
        )
        expect(link.getAttribute('target')).toBe('_blank')
    })

    it('says when the search failed', async () => {
        await searchFor(
            'scierie',
            vi.fn((): Promise<EntrepriseSearchResult> =>
                Promise.reject(new Error('réseau'))
            )
        )

        expect(
            screen.getByText('La recherche a échoué. Réessayez.')
        ).toBeDefined()
    })

    it('does not search for nothing', async () => {
        const getEntrepriseFromQuery = await searchFor('   ')

        expect(getEntrepriseFromQuery).not.toHaveBeenCalled()
    })

    it('asks for 3 characters at least instead of calling the API', async () => {
        const getEntrepriseFromQuery = await searchFor(' ab ')

        expect(getEntrepriseFromQuery).not.toHaveBeenCalled()
        expect(
            screen.getByText('Saisissez au moins 3 caractères.')
        ).toBeDefined()
    })
})
