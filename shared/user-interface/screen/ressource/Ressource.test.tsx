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

    it('opens on the first ressource of the plan, without waiting for a click', () => {
        render(
            <Ressource
                {...ressourceScreen({
                    totals: [
                        {
                            planDApprovisionnement: 1,
                            ressource: 'PF',
                            sumTonnageTotal: 120,
                        },
                        {
                            planDApprovisionnement: 1,
                            ressource: 'EC',
                            sumTonnageTotal: 40,
                        },
                    ],
                    byRegion: [
                        {
                            planDApprovisionnement: 1,
                            ressource: 'PF',
                            region: 'Nouvelle-Aquitaine',
                            sumTonnageTotal: 120,
                        },
                        {
                            planDApprovisionnement: 1,
                            ressource: 'EC',
                            region: 'Bretagne',
                            sumTonnageTotal: 40,
                        },
                    ],
                })}
                plan={1}
            />
        )

        const first = screen.getByRole<HTMLInputElement>('checkbox', {
            name: 'Sélectionner la ressource Plaquettes forestières',
        })
        const second = screen.getByRole<HTMLInputElement>('checkbox', {
            name: 'Sélectionner la ressource Écorces',
        })

        expect(first.checked).toBe(true)
        expect(second.checked).toBe(false)

        // Opened on, not merely ticked: the ventilations are showing, and they
        // are showing that ressource's rows.
        expect(screen.getByText('Nouvelle-Aquitaine')).toBeDefined()
        expect(screen.queryByText('Bretagne')).toBeNull()
    })

    it('opens on nothing when the plan has no ressource at all', () => {
        render(<Ressource {...ressourceScreen()} plan={3} />)

        // Nothing to fall back on, so the ventilations stay away rather than
        // showing another plan's first ressource.
        expect(screen.queryByText('Ventilation par région')).toBeNull()
    })

    // Which plan to read is asked for above the screen, never inside it.
    it('has no search bar of its own', () => {
        render(<Ressource {...ressourceScreen()} plan={1} />)

        expect(screen.queryByRole('combobox')).toBeNull()
        expect(screen.queryByRole('searchbox')).toBeNull()
    })
})
