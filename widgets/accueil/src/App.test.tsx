import { useGrist } from '@shared/hooks/useGrist'
import App from './App'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ACCUEIL_SPEC } from './grist'

vi.mock('@shared/hooks/useGrist', () => ({
    useGrist: vi.fn(),
}))

describe('App Widget Accueil', () => {
    it('displays Accueil when Grist data is ready', () => {
        const mockedUseGrist = vi.mocked(
            useGrist as (
                spec: typeof ACCUEIL_SPEC
            ) => ReturnType<typeof useGrist<typeof ACCUEIL_SPEC>>
        )

        mockedUseGrist.mockReturnValue({
            status: 'ready',
            data: {
                Plan_d_approvisionnement: [],
                Demande_subvention: [],
                Instruction_crb: [],
                Crb: [],
            },
            error: null,
            accessLevel: 'full',
            refetch: vi.fn(),
        })

        render(<App />)

        expect(
            screen.getByRole('heading', {
                level: 1,
                name: 'Suivi des plans d’approvisionnement',
            })
        ).toBeDefined()
    })

    it('displays the connecting message when connecting to Grist', () => {
        vi.mocked(useGrist).mockReturnValue({
            status: 'connecting',
            data: null,
            error: null,
            accessLevel: null,
            refetch: () => '',
        })

        render(<App />)

        expect(
            screen.getByText('Information : connexion à Grist en cours…')
        ).toBeDefined()
    })

    it('displays the "not in a Grist iframe" message when not in a Grist custom widget', () => {
        vi.mocked(useGrist).mockReturnValue({
            status: 'grist undefined',
            data: null,
            error: null,
            accessLevel: null,
            refetch: () => '',
        })

        render(<App />)

        expect(
            screen.getByText('Information : connexion à Grist en cours…')
        ).toBeDefined()
    })

    it('displays the loading message when Grist data is being fetched', () => {
        vi.mocked(useGrist).mockReturnValue({
            status: 'loading',
            data: null,
            error: null,
            accessLevel: 'full',
            refetch: () => '',
        })

        render(<App />)

        expect(
            screen.getByText('Information : chargement des données…')
        ).toBeDefined()
    })

    it('displays the access denied message when the user does not have the required permissions', () => {
        vi.mocked(useGrist).mockReturnValue({
            status: 'denied',
            data: null,
            error: null,
            accessLevel: 'full',
            refetch: () => '',
        })

        render(<App />)

        expect(
            screen.getByText(
                `Avertissement : ce widget a besoin d’un accès complet au document. Ouvrez le panneau de configuration du widget et choisissez « Accès complet au document ».`
            )
        ).toBeDefined()
    })

    it('displays an error message when the Grist API returns an error', () => {
        vi.mocked(useGrist).mockReturnValue({
            status: 'error',
            data: null,
            error: { message: 'There was an error', name: 'Grist API Error' },
            accessLevel: 'full',
            refetch: vi.fn(),
        })

        render(<App />)

        expect(
            screen.getByText(
                'Erreur : impossible de charger les données : There was an error'
            )
        ).toBeDefined()
    })
})
