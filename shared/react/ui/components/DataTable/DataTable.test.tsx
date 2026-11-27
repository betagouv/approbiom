import {
    cleanup,
    fireEvent,
    render,
    screen,
    within,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DataTable from './DataTable'

type Plan = {
    nom: string
    statut: string
}

const plans: Plan[] = [
    { nom: 'Plan Nord', statut: 'En cours' },
    { nom: 'Plan Sud', statut: 'Terminé' },
]

const columns = [
    { id: 'nom', header: 'Nom', render: (plan: Plan) => plan.nom },
    { id: 'statut', header: 'Statut', render: (plan: Plan) => plan.statut },
]

afterEach(() => {
    cleanup()
})

describe('DataTable', () => {
    it('renders the table caption', () => {
        render(
            <DataTable
                caption="Plans d’approvisionnement"
                rows={plans}
                columns={columns}
            />
        )

        expect(
            screen.getByRole('table', { name: 'Plans d’approvisionnement' })
        ).toBeDefined()
    })

    it('keeps a hidden caption as the table name', () => {
        render(
            <DataTable
                caption="Plans d’approvisionnement"
                hideCaption
                rows={plans}
                columns={columns}
            />
        )

        const table = screen.getByRole('table', {
            name: 'Plans d’approvisionnement',
        })
        const caption = screen.getByText('Plans d’approvisionnement')

        expect(table).toBeDefined()
        expect(caption.closest('.fr-sr-only')).not.toBeNull()
    })

    it('draws the header actions on the title line, keeping the table name', () => {
        render(
            <DataTable
                caption="Plans d’approvisionnement"
                showResultCount
                headerActions={<button type="button">Rechercher</button>}
                rows={plans}
                columns={columns}
            />
        )

        expect(
            screen.getByRole('table', {
                name: 'Plans d’approvisionnement 2 résultats',
            })
        ).toBeDefined()
        expect(
            screen
                .getByRole('button', { name: 'Rechercher' })
                .closest('.shared-data-table__header-title')
        ).not.toBeNull()
    })

    it('keeps the header actions on screen when the title is hidden', () => {
        render(
            <DataTable
                caption="Plans d’approvisionnement"
                hideCaption
                headerActions={<button type="button">Rechercher</button>}
                rows={plans}
                columns={columns}
            />
        )

        expect(
            screen
                .getByRole('button', { name: 'Rechercher' })
                .closest('.fr-sr-only')
        ).toBeNull()
    })

    it('renders all column headers', () => {
        render(
            <DataTable
                caption="Plans d’approvisionnement"
                rows={plans}
                columns={columns}
            />
        )

        const headers = screen.getAllByRole('columnheader')

        expect(headers.map((header) => header.textContent)).toEqual([
            'Nom',
            'Statut',
        ])
    })

    const selectionLabel = (plan: Plan) => `Sélectionner ${plan.nom}`

    const getCheckbox = (name: string) => screen.getByRole('checkbox', { name })

    it('does not render selection checkboxes when selection is disabled', () => {
        render(
            <DataTable
                caption="Plans d’approvisionnement"
                rows={plans}
                columns={columns}
            />
        )

        expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
        expect(screen.getAllByRole('columnheader')).toHaveLength(2)
    })

    it('renders one checkbox per row and a select-all checkbox', () => {
        render(
            <DataTable
                caption="Plans d’approvisionnement"
                rows={plans}
                columns={columns}
                selectedRows={[]}
                selectionLabel={selectionLabel}
                onSelectionChange={vi.fn()}
            />
        )

        expect(screen.getAllByRole('checkbox')).toHaveLength(plans.length + 1)
        expect(getCheckbox('Tout sélectionner')).toBeDefined()
        expect(getCheckbox('Sélectionner Plan Nord')).toBeDefined()
        expect(getCheckbox('Sélectionner Plan Sud')).toBeDefined()
    })

    it('adds a row to the selection when its checkbox is checked', () => {
        const onSelectionChange = vi.fn<(rows: Plan[]) => void>()
        render(
            <DataTable
                caption="Plans d’approvisionnement"
                rows={plans}
                columns={columns}
                selectedRows={[]}
                selectionLabel={selectionLabel}
                onSelectionChange={onSelectionChange}
            />
        )

        fireEvent.click(getCheckbox('Sélectionner Plan Nord'))

        expect(onSelectionChange).toHaveBeenCalledTimes(1)
        expect(onSelectionChange.mock.calls[0][0][0]).toBe(plans[0])
    })

    it('removes a row from the selection when its checkbox is unchecked', () => {
        const onSelectionChange = vi.fn()
        render(
            <DataTable
                caption="Plans d’approvisionnement"
                rows={plans}
                columns={columns}
                selectedRows={plans}
                selectionLabel={selectionLabel}
                onSelectionChange={onSelectionChange}
            />
        )

        fireEvent.click(getCheckbox('Sélectionner Plan Nord'))

        expect(onSelectionChange).toHaveBeenCalledTimes(1)
        expect(onSelectionChange).toHaveBeenCalledWith([plans[1]])
    })

    it('selects all rows from the header checkbox', () => {
        const onSelectionChange = vi.fn()
        render(
            <DataTable
                caption="Plans d’approvisionnement"
                rows={plans}
                columns={columns}
                selectedRows={[]}
                selectionLabel={selectionLabel}
                onSelectionChange={onSelectionChange}
            />
        )

        fireEvent.click(getCheckbox('Tout sélectionner'))

        expect(onSelectionChange).toHaveBeenCalledWith(plans)
    })

    it('clears all rows from the header checkbox', () => {
        const onSelectionChange = vi.fn()
        render(
            <DataTable
                caption="Plans d’approvisionnement"
                rows={plans}
                columns={columns}
                selectedRows={plans}
                selectionLabel={selectionLabel}
                onSelectionChange={onSelectionChange}
            />
        )

        fireEvent.click(getCheckbox('Tout sélectionner'))

        expect(onSelectionChange).toHaveBeenCalledWith([])
    })

    describe('sorting', () => {
        type Ressource = { nom: string; tonnage: number }

        // By code point "É" sorts after "P", and as text 9 / 10 / 100 read 10, 100, 9.
        const ressources: Ressource[] = [
            { nom: 'Plaquettes', tonnage: 10 },
            { nom: 'Broyat', tonnage: 100 },
            { nom: 'Écorces', tonnage: 9 },
        ]

        const sortableColumns = [
            {
                id: 'nom',
                header: 'Nom',
                render: (ressource: Ressource) => ressource.nom,
                sortBy: (ressource: Ressource) => ressource.nom,
            },
            {
                id: 'tonnage',
                header: 'Tonnage',
                render: (ressource: Ressource) => `${ressource.tonnage} t`,
                sortBy: (ressource: Ressource) => ressource.tonnage,
            },
        ]

        const renderTable = () =>
            render(
                <DataTable
                    caption="Ressources"
                    rows={ressources}
                    columns={sortableColumns}
                />
            )

        // Every sort button is named "Trier": only its header tells them apart.
        const headerFor = (name: string) =>
            screen.getByRole('columnheader', { name: new RegExp(name) })

        const sortButtonFor = (name: string) =>
            within(headerFor(name)).getByRole('button')

        const columnValues = (index: number) =>
            screen
                .getAllByRole('row')
                // Drops the header row, leaving the body in display order.
                .slice(1)
                .map((row) => row.querySelectorAll('td')[index].textContent)

        it('renders no sort button on a column that did not ask for one', () => {
            render(
                <DataTable
                    caption="Plans d’approvisionnement"
                    rows={plans}
                    columns={columns}
                />
            )

            expect(screen.queryAllByRole('button')).toHaveLength(0)
            // Not even `aria-sort="none"`, which means sortable but unsorted.
            expect(
                screen.getAllByRole('columnheader')[0].getAttribute('aria-sort')
            ).toBeNull()
        })

        it('starts unsorted, in the order the rows were given', () => {
            renderTable()

            expect(columnValues(0)).toEqual(['Plaquettes', 'Broyat', 'Écorces'])
            expect(headerFor('Nom').getAttribute('aria-sort')).toBe('none')
        })

        it('sorts ascending on the first click', () => {
            renderTable()

            fireEvent.click(sortButtonFor('Nom'))

            expect(columnValues(0)).toEqual(['Broyat', 'Écorces', 'Plaquettes'])
            expect(headerFor('Nom').getAttribute('aria-sort')).toBe('ascending')
        })

        it('sorts descending on the second click', () => {
            renderTable()

            fireEvent.click(sortButtonFor('Nom'))
            fireEvent.click(sortButtonFor('Nom'))

            expect(columnValues(0)).toEqual(['Plaquettes', 'Écorces', 'Broyat'])
            expect(headerFor('Nom').getAttribute('aria-sort')).toBe(
                'descending'
            )
        })

        it('goes back to ascending on the third click, never to unsorted', () => {
            renderTable()

            fireEvent.click(sortButtonFor('Nom'))
            fireEvent.click(sortButtonFor('Nom'))
            fireEvent.click(sortButtonFor('Nom'))

            expect(columnValues(0)).toEqual(['Broyat', 'Écorces', 'Plaquettes'])
            expect(headerFor('Nom').getAttribute('aria-sort')).toBe('ascending')
        })

        it('restarts from ascending when another column takes over', () => {
            renderTable()

            fireEvent.click(sortButtonFor('Nom'))
            fireEvent.click(sortButtonFor('Nom'))
            fireEvent.click(sortButtonFor('Tonnage'))

            expect(headerFor('Tonnage').getAttribute('aria-sort')).toBe(
                'ascending'
            )
            expect(headerFor('Nom').getAttribute('aria-sort')).toBe('none')
        })

        it('sorts numbers numerically rather than as text', () => {
            renderTable()

            fireEvent.click(sortButtonFor('Tonnage'))

            expect(columnValues(1)).toEqual(['9 t', '10 t', '100 t'])
        })

        it('sorts on `sortBy`, not on what the cell displays', () => {
            renderTable()

            fireEvent.click(sortButtonFor('Tonnage'))

            expect(columnValues(0)).toEqual(['Écorces', 'Plaquettes', 'Broyat'])
        })

        it('leaves the array it was given untouched', () => {
            const givenOrder = [...ressources]
            renderTable()

            fireEvent.click(sortButtonFor('Nom'))

            expect(ressources).toEqual(givenOrder)
        })
    })
})
