import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { PlanDApprovisionnement as Plan } from '@shared/core/domain/entities/plan-d-approvisionnement'
import type { RessourceScreen } from '@shared/user-interface/screen/ressource'
import RechercheDePlan from './RechercheDePlan'

const plan = (overrides: Partial<Plan> = {}): Plan => ({
    id: 1,
    nom: 'RC Saint Junien',
    installation: 10,
    typeDePlan: 'création',
    usage: 'énergie',
    natureDonnee: 'prévision',
    statut: 'projet',
    ...overrides,
})

function ressourceScreen(
    overrides: Partial<RessourceScreen> = {}
): RessourceScreen {
    return {
        plans: [plan(), plan({ id: 2, nom: 'BIO2 St Gaudens' })],
        totals: [
            {
                planDApprovisionnement: 1,
                ressource: 'PF',
                sumTonnageTotal: 120,
            },
            { planDApprovisionnement: 2, ressource: 'EC', sumTonnageTotal: 40 },
        ],
        byRegion: [],
        byFournisseur: [],
        byDepartementDeProvenance: [],
        ressourceTitles: new Map([
            ['PF', 'Plaquettes forestières'],
            ['EC', 'Écorces'],
        ]),
        fournisseurNames: new Map(),
        departementNames: new Map(),
        ...overrides,
    }
}

const getSearchBar = () =>
    screen.getByRole('combobox', {
        name: 'Rechercher un plan d’approvisionnement',
    })

const pick = (name: string) => {
    fireEvent.change(getSearchBar(), { target: { value: name } })
    fireEvent.click(screen.getByRole('option', { name }))
}

afterEach(() => {
    cleanup()
})

describe('RechercheDePlan', () => {
    it('offers every plan by name', () => {
        render(<RechercheDePlan {...ressourceScreen()} />)

        fireEvent.click(getSearchBar())

        expect(
            screen.getAllByRole('option').map((option) => option.textContent)
        ).toEqual(['RC Saint Junien', 'BIO2 St Gaudens'])
    })

    it('shows no ressource until a plan has been picked', () => {
        render(<RechercheDePlan {...ressourceScreen()} />)

        expect(screen.queryByText('Plaquettes forestières')).toBeNull()
    })

    it('shows the ressources of the plan that was picked', () => {
        render(<RechercheDePlan {...ressourceScreen()} />)

        pick('RC Saint Junien')

        expect(screen.getByText('Plaquettes forestières')).toBeDefined()
    })

    it('starts the screen over when another plan is picked', () => {
        render(<RechercheDePlan {...ressourceScreen()} />)

        pick('RC Saint Junien')
        pick('BIO2 St Gaudens')

        expect(screen.getByText('Écorces')).toBeDefined()
        expect(screen.queryByText('Plaquettes forestières')).toBeNull()
    })
})
