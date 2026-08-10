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

        // Queried by accessible name rather than by text: the caption is what
        // names the table for a screen reader, and this fails if it stops
        // being a `<caption>`.
        expect(
            screen.getByRole('table', { name: 'Plans d’approvisionnement' })
        ).toBeDefined()
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
        // No extra column either: the table keeps the shape it had.
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

        // Queried by accessible name: each checkbox has to say which row it
        // selects, since DSFR hides that text visually in a fixed cell.
        expect(screen.getAllByRole('checkbox')).toHaveLength(plans.length + 1)
        expect(getCheckbox('Tout sélectionner')).toBeDefined()
        expect(getCheckbox('Sélectionner Plan Nord')).toBeDefined()
        expect(getCheckbox('Sélectionner Plan Sud')).toBeDefined()
    })

    it('adds a row to the selection when its checkbox is checked', () => {
        // Typed so that reading back the reported selection stays type-safe.
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
        // The very object from `rows`, not a copy of it.
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
                // Everything selected, so the header checkbox is checked and
                // clicking it clears instead of selecting.
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

        // Deliberately awkward values. Alphabetically, "Écorces" only lands
        // between "Broyat" and "Plaquettes" under French collation — by code
        // point "É" sorts after "P". And 9 / 10 / 100 only come out in that
        // order numerically; as text they read 10, 100, 9.
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
                // Rendered as text, sorted on the number behind it — the whole
                // reason `sortBy` exists separately from `render`.
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

        // Scoped to its own header rather than picked out of a flat list of
        // buttons: every sort button is named "Trier", so only the column it
        // sits in tells them apart.
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
            // Not even `aria-sort="none"`: the column is not sortable at all,
            // which is a different thing from being sortable and unsorted.
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
            // The column it left reports itself sortable but unsorted again.
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

            // Sorting the rendered strings would have given 10, 100, 9; the
            // rows follow the numbers, so the names line up with them.
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
