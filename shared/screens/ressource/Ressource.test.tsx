import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import Ressource from './Ressource'
import type { RessourceScreen } from './load-ressource'

function ressourceScreen(
    overrides: Partial<RessourceScreen> = {}
): RessourceScreen {
    return {
        plans: [],
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

afterEach(() => {
    cleanup()
})

describe('Ressource', () => {
    it('opens on the ressources of the plan it was given', () => {
        render(<Ressource {...ressourceScreen()} plan={1} />)

        expect(screen.getByText('Plaquettes forestières')).toBeDefined()
        expect(screen.getByText(/Total : 120/)).toBeDefined()
    })

    it('leaves out the ressources of every other plan', () => {
        render(<Ressource {...ressourceScreen()} plan={1} />)

        expect(screen.queryByText('Écorces')).toBeNull()
    })

    // Which plan to read is asked for above the screen, never inside it.
    it('has no search bar of its own', () => {
        render(<Ressource {...ressourceScreen()} plan={1} />)

        expect(screen.queryByRole('combobox')).toBeNull()
        expect(screen.queryByRole('searchbox')).toBeNull()
    })
})
