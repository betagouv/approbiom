import {
    cleanup,
    fireEvent,
    render,
    screen,
    within,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type {
    PlanConcurrent,
    RessourceConcurrente,
} from '../build-plans-concurrents'
import ConcurrenceTable from './ConcurrenceTable'

const plaquettes: RessourceConcurrente = {
    nom: 'Plaquettes forestières',
    code: '1A-PFA',
    famille: '1 Bois coupé',
    provenances: { retenues: ['17', '79'], nonRetenues: ['16'] },
    fournisseurs: { retenus: ['Scierie Exemple'], nonRetenus: [] },
    tonnageRetenu: 6500,
    tonnageTotal: 12000,
}

const connexes: RessourceConcurrente = {
    nom: 'Connexes de scierie',
    code: '2B-CIB',
    famille: '2 Coproduits 1ère transfo Bois',
    provenances: { retenues: [], nonRetenues: ['86'] },
    fournisseurs: { retenus: [], nonRetenus: ['Non renseigné'] },
    tonnageRetenu: 0,
    tonnageTotal: 5800,
}

const plan = (id: number, ressources: RessourceConcurrente[]) =>
    ({
        plan: {
            id,
            nom: `Chaufferie fictive ${id}`,
            departementDeSituation: 'Charente-Maritime',
            installationCommune: null,
            statut: 'projet',
        },
        ressources,
    }) satisfies PlanConcurrent

afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

describe('ConcurrenceTable', () => {
    it('counts the plans, and draws no total line', () => {
        render(
            <ConcurrenceTable
                plansConcurrents={[plan(1, [plaquettes]), plan(2, [connexes])]}
            />
        )

        expect(
            screen.getByRole('table', {
                name: "Plans d'approvisionnement concernés 2 plans correspondent aux filtres",
            })
        ).toBeDefined()
        expect(screen.queryByText(/Total/)).toBeNull()
    })

    it('reads each plan as a group header, with its statut and département', () => {
        render(<ConcurrenceTable plansConcurrents={[plan(1, [plaquettes])]} />)

        const header = screen
            .getByRole('button', { name: 'Chaufferie fictive 1' })
            .closest('th')

        expect(header?.colSpan).toBe(4)
        expect(header?.textContent).toContain('projet')
        expect(header?.textContent).toContain('Charente-Maritime')
    })

    it('shows retenus and non retenus, and the tonnage retenu over the total', () => {
        render(<ConcurrenceTable plansConcurrents={[plan(1, [plaquettes])]} />)

        const cells = within(
            screen.getByText('Plaquettes forestières').closest('tr')!
        ).getAllByRole('cell')

        expect(
            cells.map((cell) => cell.textContent?.replace(/\s/g, ' '))
        ).toEqual([
            'Retenus : 17, 79Non retenus : 16',
            'Retenus : Scierie Exemple',
            '6 500 retenus /sur 12 000',
        ])
    })

    it('names the famille of each ressource after its name', () => {
        render(<ConcurrenceTable plansConcurrents={[plan(1, [connexes])]} />)

        expect(
            screen.getByText('Connexes de scierie').closest('th')?.textContent
        ).toBe('Connexes de scierie (famille : Coproduits 1ère transfo Bois)')
        expect(screen.queryByRole('img')).toBeNull()
    })

    it('ties every cell to headers that exist', () => {
        const { container } = render(
            <ConcurrenceTable
                plansConcurrents={[
                    plan(1, [plaquettes, connexes]),
                    plan(2, [plaquettes]),
                ]}
            />
        )

        const cells = container.querySelectorAll('tbody td, tbody th[headers]')
        expect(cells).toHaveLength(3 * 4)

        for (const cell of cells) {
            const ids = cell.getAttribute('headers')?.split(' ') ?? []
            expect(ids.length).toBeGreaterThanOrEqual(2)
            for (const id of ids) {
                expect(document.getElementById(id)?.tagName).toBe('TH')
            }
        }
    })

    it('folds and unfolds the ressources of a plan', () => {
        render(<ConcurrenceTable plansConcurrents={[plan(1, [plaquettes])]} />)

        const toggle = screen.getByRole('button', {
            name: 'Chaufferie fictive 1',
        })
        const row = screen.getByText('Plaquettes forestières').closest('tr')!

        expect(toggle.getAttribute('aria-expanded')).toBe('true')
        expect(toggle.getAttribute('aria-controls')).toBe(row.id)
        expect(row.hidden).toBe(false)

        fireEvent.click(toggle)

        expect(toggle.getAttribute('aria-expanded')).toBe('false')
        expect(row.hidden).toBe(true)

        fireEvent.click(toggle)

        expect(row.hidden).toBe(false)
    })

    it('lets keyboard users reach the scrolling area', () => {
        render(<ConcurrenceTable plansConcurrents={[plan(1, [plaquettes])]} />)

        const region = screen.getByRole('region', {
            name: "Plans d'approvisionnement concernés",
        })

        expect(region.tabIndex).toBe(0)
        expect(within(region).getByRole('table')).toBeDefined()
    })

    it('keeps the focused toggle below the sticky header, however tall', () => {
        vi.stubGlobal(
            'ResizeObserver',
            class {
                constructor(private readonly callback: () => void) {}
                observe() {
                    this.callback()
                }
                disconnect() {}
            }
        )
        vi.spyOn(
            HTMLTableSectionElement.prototype,
            'getBoundingClientRect'
        ).mockReturnValue({ height: 120 } as DOMRect)

        const { container } = render(
            <ConcurrenceTable plansConcurrents={[plan(1, [plaquettes])]} />
        )

        expect(
            container
                .querySelector<HTMLElement>('.concurrence-table')
                ?.style.getPropertyValue('--concurrence-table-header-height')
        ).toBe('120px')
    })

    it('says so when no plan is left', () => {
        render(<ConcurrenceTable plansConcurrents={[]} />)

        expect(
            screen.getByRole('table', {
                name: "Plans d'approvisionnement concernés Aucun plan ne correspond aux filtres",
            })
        ).toBeDefined()
        expect(document.querySelector('tbody')).toBeNull()
    })
})
