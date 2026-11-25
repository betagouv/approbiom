import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import MultiSelect from './MultiSelect'
import type { MultiSelectItem } from './MultiSelect.types'

const items: readonly MultiSelectItem<string>[] = [
    {
        id: 'alsace',
        label: 'Alsace',
        options: [
            { value: '67', label: 'Bas-Rhin' },
            { value: '68', label: 'Haut-Rhin' },
        ],
    },
    {
        id: 'champagne-ardenne',
        label: 'Champagne-Ardenne',
        options: [{ value: '08', label: 'Ardennes' }],
    },
    { value: '88', label: 'Vosges' },
]

afterEach(() => {
    cleanup()
})

function ControlledMultiSelect({
    initialSelection = [],
    searchable = false,
}: {
    initialSelection?: string[]
    searchable?: boolean
}) {
    const [selected, setSelected] = useState(initialSelection)

    return (
        <MultiSelect
            label="Départements"
            legend="Départements du Grand Est"
            showSelectAll
            searchable={searchable}
            options={items}
            selectedValues={selected}
            onSelectionChange={setSelected}
        />
    )
}

const getTrigger = () => screen.getByRole('button', { name: /Départements/ })

const getCheckbox = (name: string) =>
    screen.getByRole<HTMLInputElement>('checkbox', { name })

const open = () => fireEvent.click(getTrigger())

describe('MultiSelect', () => {
    it('invites a selection while nothing is selected', () => {
        render(<ControlledMultiSelect />)

        expect(getTrigger().textContent).toContain('Sélectionner une option')
    })

    it('shows the selection in place of the invitation', () => {
        render(<ControlledMultiSelect initialSelection={['88']} />)

        expect(getTrigger().textContent).toContain('Vosges')
        expect(getTrigger().textContent).not.toContain(
            'Sélectionner une option'
        )
    })

    it('opens the options panel when the trigger is clicked', () => {
        render(<ControlledMultiSelect />)

        // The panel is `hidden`, so it is out of the accessibility tree and out
        // of the tab order — role queries ignore it, which is the assertion.
        expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
        expect(getTrigger().getAttribute('aria-expanded')).toBe('false')

        open()

        expect(screen.getAllByRole('checkbox')).toHaveLength(6)
        expect(getTrigger().getAttribute('aria-expanded')).toBe('true')
    })

    it('closes the options panel when a click lands outside it', () => {
        render(<ControlledMultiSelect />)
        open()

        // `mousedown` rather than `click`: that is the event the component
        // dismisses on, and firing `click` alone would pass for the wrong
        // reason — or rather, would not pass at all.
        fireEvent.mouseDown(document.body)

        expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
        expect(getTrigger().getAttribute('aria-expanded')).toBe('false')
    })

    it('closes the options panel when Escape is pressed', () => {
        render(<ControlledMultiSelect />)
        open()

        // Fired from inside the panel, which is where the focus is once the
        // user has tabbed into the options.
        fireEvent.keyDown(getCheckbox('Bas-Rhin'), { key: 'Escape' })

        expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
        expect(getTrigger().getAttribute('aria-expanded')).toBe('false')
    })

    it('returns the focus to the trigger when Escape closes the panel', () => {
        render(<ControlledMultiSelect />)
        open()

        fireEvent.keyDown(getCheckbox('Bas-Rhin'), { key: 'Escape' })

        // Without this the focus would sit on an element that no longer exists
        // and the user would be dropped back at the top of the document.
        expect(document.activeElement).toBe(getTrigger())
    })

    it('leaves the options panel open on any other key', () => {
        render(<ControlledMultiSelect />)
        open()

        fireEvent.keyDown(getCheckbox('Bas-Rhin'), { key: 'Enter' })

        expect(screen.getAllByRole('checkbox')).toHaveLength(6)
    })

    it('keeps the options panel open when a click lands inside it', () => {
        render(<ControlledMultiSelect />)
        open()

        // Ticking an option is a click inside the panel, and it has to leave
        // the panel alone — otherwise no one could ever pick two options.
        fireEvent.mouseDown(getCheckbox('Bas-Rhin'))

        expect(screen.getAllByRole('checkbox')).toHaveLength(6)
    })

    it('closes the options panel when the trigger is clicked again', () => {
        render(<ControlledMultiSelect />)
        open()

        // The trigger sits inside the component, so the outside-click handler
        // has to ignore it and leave the closing to its own toggle. Were both
        // to fire, the panel would close and reopen in the same gesture.
        fireEvent.mouseDown(getTrigger())
        fireEvent.click(getTrigger())

        expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
    })

    it('selects an ungrouped option when its checkbox is clicked', () => {
        render(<ControlledMultiSelect />)
        open()

        fireEvent.click(getCheckbox('Vosges'))

        expect(getCheckbox('Vosges').checked).toBe(true)
        expect(getCheckbox('Bas-Rhin').checked).toBe(false)
    })

    it('deselects a selected option when its checkbox is clicked again', () => {
        render(<ControlledMultiSelect initialSelection={['88']} />)
        open()

        expect(getCheckbox('Vosges').checked).toBe(true)

        fireEvent.click(getCheckbox('Vosges'))

        expect(getCheckbox('Vosges').checked).toBe(false)
    })

    it('renders option groups with their labels', () => {
        render(<ControlledMultiSelect />)
        open()

        expect(getCheckbox('Alsace')).toBeDefined()
        expect(getCheckbox('Champagne-Ardenne')).toBeDefined()

        const nested = getCheckbox('Bas-Rhin').closest(
            '.shared-multi-select__group-options'
        )
        expect(nested).not.toBeNull()
        // The group's own checkbox stays outside the block it controls.
        expect(nested?.contains(getCheckbox('Alsace'))).toBe(false)
    })

    it('selects all options when the select-all button is clicked', () => {
        render(<ControlledMultiSelect />)
        open()

        fireEvent.click(
            screen.getByRole('button', { name: 'Tout sélectionner' })
        )

        for (const checkbox of screen.getAllByRole<HTMLInputElement>(
            'checkbox'
        )) {
            expect(checkbox.checked).toBe(true)
        }
    })

    it('deselects all options when the deselect-all button is clicked', () => {
        render(
            <ControlledMultiSelect
                initialSelection={['67', '68', '08', '88']}
            />
        )
        open()

        fireEvent.click(
            screen.getByRole('button', { name: 'Tout désélectionner' })
        )

        for (const checkbox of screen.getAllByRole<HTMLInputElement>(
            'checkbox'
        )) {
            expect(checkbox.checked).toBe(false)
        }
    })

    it('selects all options in a group when the group checkbox is clicked', () => {
        render(<ControlledMultiSelect />)
        open()

        fireEvent.click(getCheckbox('Alsace'))

        expect(getCheckbox('Bas-Rhin').checked).toBe(true)
        expect(getCheckbox('Haut-Rhin').checked).toBe(true)

        expect(getCheckbox('Ardennes').checked).toBe(false)
        expect(getCheckbox('Vosges').checked).toBe(false)
    })

    it('shows the correct global selection state when only some options are selected', () => {
        render(<ControlledMultiSelect initialSelection={['67']} />)
        open()

        const alsace = getCheckbox('Alsace')
        expect(alsace.checked).toBe(false)
        expect(alsace.indeterminate).toBe(true)

        expect(getCheckbox('Champagne-Ardenne').indeterminate).toBe(false)

        expect(
            screen.getByRole('button', { name: 'Tout sélectionner' })
        ).toBeDefined()
    })

    describe('when searchable', () => {
        const search = (text: string) =>
            fireEvent.change(
                screen.getByRole('searchbox', {
                    name: 'Rechercher dans Départements',
                }),
                { target: { value: text } }
            )

        const shownOptions = () =>
            screen
                .getAllByRole<HTMLInputElement>('checkbox')
                .map((checkbox) => checkbox.labels?.[0]?.textContent)

        it('has no search field unless asked for', () => {
            render(<ControlledMultiSelect />)
            open()

            expect(screen.queryByRole('searchbox')).toBeNull()
        })

        it('puts the focus in the search field when the panel opens', () => {
            render(<ControlledMultiSelect searchable />)
            open()

            expect(document.activeElement).toBe(screen.getByRole('searchbox'))
        })

        it('narrows the options to the labels holding the query, accents and case aside', () => {
            render(<ControlledMultiSelect searchable />)
            open()

            search('RHIN')

            expect(shownOptions()).toEqual(['Alsace', 'Bas-Rhin', 'Haut-Rhin'])
        })

        it('keeps a whole group whose own label matches', () => {
            render(<ControlledMultiSelect searchable />)
            open()

            search('alsace')

            expect(shownOptions()).toEqual(['Alsace', 'Bas-Rhin', 'Haut-Rhin'])
        })

        it('drops a group none of whose options match', () => {
            render(<ControlledMultiSelect searchable />)
            open()

            search('bas')

            expect(shownOptions()).toEqual(['Alsace', 'Bas-Rhin'])
        })

        it('says so when nothing matches', () => {
            render(<ControlledMultiSelect searchable />)
            open()

            search('introuvable')

            expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
            expect(screen.getByText('Aucun résultat')).toBeDefined()
        })

        it('selects only the options shown when everything is selected', () => {
            render(<ControlledMultiSelect searchable />)
            open()

            search('ardennes')
            fireEvent.click(
                screen.getByRole('button', { name: 'Tout sélectionner' })
            )
            search('')

            expect(getCheckbox('Ardennes').checked).toBe(true)
            expect(getCheckbox('Vosges').checked).toBe(false)
            expect(getCheckbox('Bas-Rhin').checked).toBe(false)
        })

        it('keeps the selection made before searching', () => {
            render(
                <ControlledMultiSelect searchable initialSelection={['88']} />
            )
            open()

            search('bas')
            fireEvent.click(getCheckbox('Bas-Rhin'))
            search('')

            expect(getCheckbox('Bas-Rhin').checked).toBe(true)
            expect(getCheckbox('Vosges').checked).toBe(true)
        })

        it('checks only the options shown when a group is checked', () => {
            render(<ControlledMultiSelect searchable />)
            open()

            search('bas')
            fireEvent.click(getCheckbox('Alsace'))
            search('')

            expect(getCheckbox('Bas-Rhin').checked).toBe(true)
            expect(getCheckbox('Haut-Rhin').checked).toBe(false)
            expect(getCheckbox('Alsace').indeterminate).toBe(true)
        })

        it('keeps the id of an option whatever the search leaves of its group', () => {
            render(<ControlledMultiSelect searchable />)
            open()
            const hautRhinId = getCheckbox('Haut-Rhin').id

            search('haut')

            expect(getCheckbox('Haut-Rhin').id).toBe(hautRhinId)
        })

        it('says nothing until something is searched', () => {
            render(<ControlledMultiSelect searchable />)
            open()

            expect(screen.getByRole('status').textContent).toBe('')
        })

        it('announces how many options the search leaves', () => {
            render(<ControlledMultiSelect searchable />)
            open()

            search('rhin')
            expect(screen.getByRole('status').textContent).toBe('2 résultats')

            search('vosges')
            expect(screen.getByRole('status').textContent).toBe('1 résultat')

            search('introuvable')
            expect(screen.getByRole('status').textContent).toBe(
                'Aucun résultat'
            )
        })

        it('starts from the whole list each time it opens', () => {
            render(<ControlledMultiSelect searchable />)
            open()
            search('bas')

            open()
            open()

            expect(screen.getByRole<HTMLInputElement>('searchbox').value).toBe(
                ''
            )
            expect(shownOptions()).toHaveLength(6)
        })
    })
})
