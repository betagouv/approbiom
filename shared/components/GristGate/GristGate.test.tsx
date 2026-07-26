import GristGate from './GristGate'
import type { UseGristResult } from '@shared/hooks/useGrist'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

type Data = { items: readonly string[] }

afterEach(cleanup)

function renderGate(
    state: UseGristResult<Data>,
    props: { fakeData?: Data } = {}
) {
    return render(
        <GristGate state={state} fakeData={props.fakeData}>
            {(data) => <p>Chargé : {data.items.join(', ')}</p>}
        </GristGate>
    )
}

describe('GristGate', () => {
    it('shows the connecting message', () => {
        renderGate({
            status: 'connecting',
            data: null,
            error: null,
            accessLevel: null,
            refetch: vi.fn(),
        })

        expect(
            screen.getByText('Information : connexion à Grist en cours…')
        ).toBeDefined()
    })

    it('shows a default warning off-Grist when no preview is given', () => {
        renderGate({
            status: 'grist undefined',
            data: null,
            error: null,
            accessLevel: null,
            refetch: vi.fn(),
        })

        expect(
            screen.getByText(/cette page n’est pas ouverte dans\s+Grist/)
        ).toBeDefined()
    })

    it('renders fake data through children off-Grist, under a warning', () => {
        renderGate(
            {
                status: 'grist undefined',
                data: null,
                error: null,
                accessLevel: null,
                refetch: vi.fn(),
            },
            { fakeData: { items: ['x', 'y'] } }
        )

        expect(screen.getByText('Chargé : x, y')).toBeDefined()
        expect(
            screen.getByText(/données affichées ci-dessous sont fictives/)
        ).toBeDefined()
    })

    it('shows the access-denied message', () => {
        renderGate({
            status: 'denied',
            data: null,
            error: null,
            accessLevel: 'read table',
            refetch: vi.fn(),
        })

        expect(
            screen.getByText(/besoin d’un accès complet au\s+document/)
        ).toBeDefined()
    })

    it('shows the loading message', () => {
        renderGate({
            status: 'loading',
            data: null,
            error: null,
            accessLevel: 'full',
            refetch: vi.fn(),
        })

        expect(
            screen.getByText('Information : chargement des données…')
        ).toBeDefined()
    })

    it('shows the error message and retries on click', () => {
        const refetch = vi.fn()
        renderGate({
            status: 'error',
            data: null,
            error: new Error('boom'),
            accessLevel: 'full',
            refetch,
        })

        expect(
            screen.getByText(
                'Erreur : impossible de charger les données : boom'
            )
        ).toBeDefined()

        fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
        expect(refetch).toHaveBeenCalledOnce()
    })

    it('renders children with the data when ready', () => {
        renderGate({
            status: 'ready',
            data: { items: ['a', 'b'] },
            error: null,
            accessLevel: 'full',
            refetch: vi.fn(),
        })

        expect(screen.getByText('Chargé : a, b')).toBeDefined()
    })
})
