import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import Screen from './Screen'
import type { SelectablePlan } from './ScreenSelectPlan'

const PLANS: readonly SelectablePlan[] = [
    {
        id: 1,
        nom: 'Plan appro chaufferie Tulle 2024',
        typeDePlan: 'création',
        statut: 'en fonctionnement',
        appelsAProjet: ['BCIAT (2023)'],
    },
    {
        id: 2,
        nom: 'Plan appro scierie Ussel',
        typeDePlan: 'projet',
        statut: 'projet',
        appelsAProjet: [],
    },
]

afterEach(cleanup)

const search = () => screen.getByRole('combobox', { name: /Plan/ })

function choose(nom: string) {
    fireEvent.change(search(), { target: { value: nom } })
    fireEvent.click(screen.getByRole('option', { name: nom }))
}

describe('Screen', () => {
    it('opens on the plan search', () => {
        render(<Screen plans={PLANS} />)

        expect(
            screen.getByRole('heading', {
                name: "Approvisionnements d'un plan",
            })
        ).toBeTruthy()
        expect(search()).toBeTruthy()
    })

    it('shows the chosen plan in place of the search', () => {
        render(<Screen plans={PLANS} />)

        choose('Plan appro chaufferie Tulle 2024')

        expect(
            screen.getByRole('heading', {
                name: 'Plan appro chaufferie Tulle 2024',
            })
        ).toBeTruthy()
        expect(screen.queryByRole('combobox')).toBeNull()
        expect(screen.getByText('BCIAT (2023)')).toBeTruthy()
    })

    it('says when a plan answers no appel à projet', () => {
        render(<Screen plans={PLANS} />)

        choose('Plan appro scierie Ussel')

        expect(screen.getByText('Inconnu')).toBeTruthy()
    })

    it('goes back to the plan without choosing another one', () => {
        render(<Screen plans={PLANS} />)
        choose('Plan appro chaufferie Tulle 2024')

        fireEvent.click(screen.getByRole('button', { name: 'Changer de plan' }))
        fireEvent.click(
            screen.getByRole('button', {
                name: 'Revenir au plan « Plan appro chaufferie Tulle 2024 »',
            })
        )

        expect(
            screen.getByRole('heading', {
                name: 'Plan appro chaufferie Tulle 2024',
            })
        ).toBeTruthy()
    })

    it('switches to another plan', () => {
        render(<Screen plans={PLANS} />)
        choose('Plan appro chaufferie Tulle 2024')

        fireEvent.click(screen.getByRole('button', { name: 'Changer de plan' }))
        choose('Plan appro scierie Ussel')

        expect(
            screen.getByRole('heading', { name: 'Plan appro scierie Ussel' })
        ).toBeTruthy()
    })
})
