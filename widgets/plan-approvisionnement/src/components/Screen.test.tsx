import { afterEach, describe, expect, it, vi } from 'vitest'
import {
    cleanup,
    fireEvent,
    render,
    screen,
    within,
} from '@testing-library/react'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import { DEPARTEMENT_FRANCAIS } from '@shared/core/domain/value-objects/provenance'
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

const DATA = {
    approvisionnements: [],
    attachments: [],
    entreprises: [],
    ressources: [],
    departementsByRegion: [],
    pays: [],
    updateApprovisionnement: () => Promise.resolve(),
    deleteApprovisionnement: () => Promise.resolve(),
}

afterEach(cleanup)

const search = () => screen.getByRole('combobox', { name: /Plan/ })

function choose(nom: string) {
    fireEvent.change(search(), { target: { value: nom } })
    fireEvent.click(screen.getByRole('option', { name: nom }))
}

const SAINT_JUNIEN: Approvisionnement = {
    id: 7,
    planDApprovisionnement: 1,
    ressource: '1A-PFA',
    provenance: { source: DEPARTEMENT_FRANCAIS, code: '19' },
    tonnageTotal: 300,
}

describe('Screen', () => {
    it('drops a deleted approvisionnement and says so', async () => {
        const deleteApprovisionnement = vi.fn(() => Promise.resolve())
        render(
            <Screen
                plans={PLANS}
                {...DATA}
                approvisionnements={[SAINT_JUNIEN]}
                deleteApprovisionnement={deleteApprovisionnement}
            />
        )
        choose('Plan appro chaufferie Tulle 2024')

        fireEvent.click(screen.getByRole('button', { name: /^Supprimer/ }))
        fireEvent.click(
            within(screen.getByRole('dialog')).getByRole('button', {
                name: 'Supprimer',
            })
        )

        expect((await screen.findByRole('status')).textContent).toBe(
            'Approvisionnement supprimé.'
        )
        expect(deleteApprovisionnement).toHaveBeenCalledWith(7)
        expect(
            within(screen.getByRole('tabpanel')).getByText(
                'Aucun approvisionnement pour ce plan'
            )
        ).toBeTruthy()
    })

    it('opens on the plan search', () => {
        render(<Screen plans={PLANS} {...DATA} />)

        expect(
            screen.getByRole('heading', {
                name: "Approvisionnements d'un plan",
            })
        ).toBeTruthy()
        expect(search()).toBeTruthy()
    })

    it('shows the chosen plan in place of the search', () => {
        render(<Screen plans={PLANS} {...DATA} />)

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
        render(<Screen plans={PLANS} {...DATA} />)

        choose('Plan appro scierie Ussel')

        expect(screen.getByText('Inconnu')).toBeTruthy()
    })

    it('goes back to the plan without choosing another one', () => {
        render(<Screen plans={PLANS} {...DATA} />)
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
        render(<Screen plans={PLANS} {...DATA} />)
        choose('Plan appro chaufferie Tulle 2024')

        fireEvent.click(screen.getByRole('button', { name: 'Changer de plan' }))
        choose('Plan appro scierie Ussel')

        expect(
            screen.getByRole('heading', { name: 'Plan appro scierie Ussel' })
        ).toBeTruthy()
    })
})
