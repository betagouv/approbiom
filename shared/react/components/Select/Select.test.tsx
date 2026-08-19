import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import Select from './Select'
import type { SelectItem, SelectMessage } from './Select.types'

// The same shape MultiSelect is tested against, so the two components are shown
// to take one and the same list of options.
const items: readonly SelectItem<string>[] = [
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

function ControlledSelect({
    initialValue = null,
    options = items,
    message,
    disabled,
}: {
    initialValue?: string | null
    options?: readonly SelectItem<string>[]
    message?: SelectMessage
    disabled?: boolean
}) {
    const [value, setValue] = useState<string | null>(initialValue)

    return (
        <Select
            label="Département"
            description="Un seul département"
            options={options}
            value={value}
            onChange={setValue}
            message={message}
            disabled={disabled}
        />
    )
}

const getSelect = () =>
    screen.getByRole<HTMLSelectElement>('combobox', { name: /Département/ })

const getOption = (name: string) =>
    screen.getByRole<HTMLOptionElement>('option', { name })

describe('Select', () => {
    it('renders every option, grouped and ungrouped', () => {
        render(<ControlledSelect />)

        // Four, not five: the placeholder is `hidden`, so it is out of the
        // accessibility tree and role queries ignore it. That is the point of
        // it — it is a prompt, and the user is never offered it as a choice.
        expect(screen.getAllByRole('option')).toHaveLength(4)
        expect(getOption('Bas-Rhin')).toBeDefined()
        expect(getOption('Vosges')).toBeDefined()
    })

    it('renders groups as optgroups holding their own options', () => {
        render(<ControlledSelect />)

        const group = getOption('Bas-Rhin').closest('optgroup')
        expect(group?.label).toBe('Alsace')
        // The ungrouped option stays outside every group.
        expect(getOption('Vosges').closest('optgroup')).toBeNull()
    })

    it('shows the placeholder while nothing is selected', () => {
        render(<ControlledSelect />)

        expect(getSelect().value).toBe('')

        // Queried off the DOM rather than by role: `hidden` keeps it out of the
        // accessibility tree, which is why `getOption` cannot reach it.
        const placeholder =
            getSelect().querySelector<HTMLOptionElement>('option[value=""]')
        expect(placeholder?.textContent).toBe('Sélectionner une option')
        // Not pickable, so the user cannot go back to "nothing selected" once
        // they have chosen — they can only change their choice.
        expect(placeholder?.disabled).toBe(true)
    })

    it('shows the option matching the value it is given', () => {
        render(<ControlledSelect initialValue="08" />)

        expect(getOption('Ardennes').selected).toBe(true)
    })

    it('reports the value of the option the user picks', () => {
        render(<ControlledSelect />)

        // The DOM value is a position rather than the caller's value, so the
        // option's own `value` attribute is what has to be fired back.
        fireEvent.change(getSelect(), {
            target: { value: getOption('Vosges').value },
        })

        expect(getOption('Vosges').selected).toBe(true)
    })

    it('replaces the selection rather than adding to it', () => {
        render(<ControlledSelect initialValue="67" />)

        fireEvent.change(getSelect(), {
            target: { value: getOption('Haut-Rhin').value },
        })

        expect(getOption('Haut-Rhin').selected).toBe(true)
        expect(getOption('Bas-Rhin').selected).toBe(false)
        expect(
            screen
                .getAllByRole<HTMLOptionElement>('option')
                .filter((option) => option.selected)
        ).toHaveLength(1)
    })

    it('tells apart two options sharing a label in different groups', () => {
        const duplicated: readonly SelectItem<string>[] = [
            {
                id: 'a',
                label: 'Groupe A',
                options: [{ value: 'a-1', label: 'Premier' }],
            },
            {
                id: 'b',
                label: 'Groupe B',
                options: [{ value: 'b-1', label: 'Premier' }],
            },
        ]
        render(<ControlledSelect options={duplicated} />)

        const [, second] = screen.getAllByRole<HTMLOptionElement>('option', {
            name: 'Premier',
        })
        fireEvent.change(getSelect(), { target: { value: second.value } })

        // Positions, not labels, are what the DOM carries — so the second one
        // is the one that ends up selected.
        expect(second.selected).toBe(true)
    })

    it('falls back to the placeholder when the value matches no option', () => {
        // A value the caller kept around for an option that is no longer
        // offered must not draw as selected.
        render(<ControlledSelect initialValue="99" />)

        expect(getSelect().value).toBe('')
    })

    it('renders a disabled option without making it pickable', () => {
        render(
            <ControlledSelect
                options={[
                    { value: '88', label: 'Vosges' },
                    { value: '67', label: 'Bas-Rhin', disabled: true },
                ]}
            />
        )

        expect(getOption('Bas-Rhin').disabled).toBe(true)
        expect(getOption('Vosges').disabled).toBe(false)
    })

    it('disables every option of a disabled group', () => {
        render(
            <ControlledSelect
                options={[
                    {
                        id: 'alsace',
                        label: 'Alsace',
                        disabled: true,
                        options: [{ value: '67', label: 'Bas-Rhin' }],
                    },
                ]}
            />
        )

        expect(getOption('Bas-Rhin').closest('optgroup')?.disabled).toBe(true)
    })

    it('disables the whole list when asked', () => {
        render(<ControlledSelect disabled />)

        expect(getSelect().disabled).toBe(true)
    })

    it('carries the description in its accessible name', () => {
        render(<ControlledSelect />)

        // The hint sits inside the `<label>`, so it is read out with the
        // libellé rather than after it.
        //
        // No space between the two here: `fr-hint-text` is `display: block`, so
        // a browser separates them, but jsdom loads no CSS and reads the span
        // as inline. The regexp is what keeps the assertion about the hint
        // being part of the name rather than about jsdom's spacing.
        expect(getSelect()).toBe(
            screen.getByRole('combobox', {
                name: /^Département\s*Un seul département$/,
            })
        )
    })

    it('shows an error message and marks the list invalid', () => {
        render(
            <ControlledSelect
                message={{ severity: 'error', text: 'Champ obligatoire' }}
            />
        )

        expect(screen.getByText('Champ obligatoire').className).toContain(
            'fr-message--error'
        )
        expect(getSelect().getAttribute('aria-invalid')).toBe('true')
        expect(getSelect().closest('.fr-select-group')?.className).toContain(
            'fr-select-group--error'
        )
    })

    it('shows a success message without marking the list invalid', () => {
        render(
            <ControlledSelect
                message={{ severity: 'valid', text: 'Département reconnu' }}
            />
        )

        expect(screen.getByText('Département reconnu').className).toContain(
            'fr-message--valid'
        )
        expect(getSelect().getAttribute('aria-invalid')).toBeNull()
    })

    it('keeps the live region on the page while there is nothing to say', () => {
        render(<ControlledSelect />)

        // A messages block that only appears along with its message appears too
        // late to be announced, so it is rendered empty and stays.
        const messages = document.querySelector('.fr-messages-group')
        expect(messages?.getAttribute('aria-live')).toBe('polite')
        expect(getSelect().getAttribute('aria-describedby')).toBe(messages?.id)
    })
})
