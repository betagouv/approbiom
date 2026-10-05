import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import EntrepriseSearch from './EntrepriseSearch'

const ENTREPRISE = {
    denomination: 'SCIERIE FICTIVE DU VALLON',
    siret: '00000000000003',
}

afterEach(cleanup)

async function searchFor(
    query: string,
    getEntrepriseFromQuery = vi.fn((): Promise<Entreprise | null> =>
        Promise.resolve(ENTREPRISE)
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

    it('shows the dénomination and the SIRET, each with its copy button', async () => {
        await searchFor('scierie')

        const result = screen.getByRole('region', {
            name: 'Entreprise trouvée',
        })
        expect(result.textContent).toContain('SCIERIE FICTIVE DU VALLON')
        expect(result.textContent).toContain('00000000000003')
        expect(
            screen.getByRole('button', { name: 'Copier la dénomination' })
        ).toBeDefined()
        expect(
            screen.getByRole('button', { name: 'Copier le SIRET' })
        ).toBeDefined()
    })

    it('says when nothing matches', async () => {
        await searchFor(
            'introuvable',
            vi.fn((): Promise<Entreprise | null> => Promise.resolve(null))
        )

        expect(
            screen.getByText(
                'Aucune entreprise ne correspond à « introuvable ».'
            )
        ).toBeDefined()
    })

    it('says when the search failed', async () => {
        await searchFor(
            'scierie',
            vi.fn((): Promise<Entreprise | null> =>
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
})
