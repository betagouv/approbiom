import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
    within,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { FoundEntreprise } from '@shared/core/application/ports/entreprise-search'
import EntrepriseSearch from './EntrepriseSearch'

const ENTREPRISES: FoundEntreprise[] = [
    { denomination: 'SCIERIE FICTIVE DU VALLON', siret: '00000000000003' },
    { denomination: 'SCIERIE FICTIVE DU PLATEAU', siret: '00000000000004' },
]

afterEach(cleanup)

async function searchFor(
    query: string,
    getEntrepriseFromQuery = vi.fn((): Promise<FoundEntreprise[]> =>
        Promise.resolve(ENTREPRISES)
    )
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
        await searchFor(
            'vallon',
            vi.fn((): Promise<FoundEntreprise[]> =>
                Promise.resolve([ENTREPRISES[0]])
            )
        )

        expect(
            screen.getByRole('region', { name: '1 entreprise trouvée' })
        ).toBeDefined()
    })

    it('says when nothing matches, with a link to the Annuaire des Entreprises', async () => {
        await searchFor(
            'scierie introuvable',
            vi.fn((): Promise<FoundEntreprise[]> => Promise.resolve([]))
        )

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
            vi.fn((): Promise<FoundEntreprise[]> =>
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
