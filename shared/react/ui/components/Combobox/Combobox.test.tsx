import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import Combobox from './Combobox'
import type { ComboboxAction, ComboboxOption } from './Combobox.types'

const OPTIONS: readonly ComboboxOption<string>[] = [
    { value: 'durand', label: 'Atelier Durand Menuiserie' },
    { value: 'lefevre', label: 'Cabinet Lefèvre Conseil' },
    { value: 'imprimerie', label: 'Imprimerie du Centre' },
]

afterEach(() => {
    cleanup()
})

function renderCombobox({
    value = null,
    action,
    onChange = vi.fn(),
}: {
    value?: string | null
    action?: ComboboxAction
    onChange?: (value: string | null) => void
} = {}) {
    function Controlled() {
        const [current, setCurrent] = useState(value)

        return (
            <Combobox
                label="Fournisseur"
                hint="Recherchez par dénomination."
                options={OPTIONS}
                value={current}
                onChange={(next) => {
                    setCurrent(next)
                    onChange(next)
                }}
                action={action}
            />
        )
    }

    render(<Controlled />)

    return { onChange }
}

const getInput = () =>
    screen.getByRole<HTMLInputElement>('combobox', { name: /Fournisseur/ })

const optionTexts = () =>
    screen.queryAllByRole('option').map((option) => option.textContent)

const type = (text: string) =>
    fireEvent.change(getInput(), { target: { value: text } })

const press = (key: string) => fireEvent.keyDown(getInput(), { key })

describe('Combobox', () => {
    it('is a labelled combobox, closed at first', () => {
        renderCombobox()

        expect(getInput().getAttribute('aria-expanded')).toBe('false')
        expect(optionTexts()).toEqual([])
    })

    it('lists every option when the field is clicked', () => {
        renderCombobox()

        fireEvent.click(getInput())

        expect(getInput().getAttribute('aria-expanded')).toBe('true')
        expect(optionTexts()).toEqual(OPTIONS.map(({ label }) => label))
    })

    it('filters the options without minding case or accents', () => {
        renderCombobox()

        type('LEFEVRE')

        expect(optionTexts()).toEqual(['Cabinet Lefèvre Conseil'])
    })

    it('puts the part that matches in bold', () => {
        renderCombobox()

        type('centre')

        expect(
            screen.getByRole('option').querySelector('strong')?.textContent
        ).toBe('Centre')
    })

    it('says when nothing matches', () => {
        renderCombobox()

        type('zzz')

        expect(
            screen.getByText('Aucun résultat ne correspond à « zzz ».')
        ).toBeDefined()
    })

    it('makes the first match active as soon as something is typed', () => {
        renderCombobox()

        type('a')

        const active = getInput().getAttribute('aria-activedescendant')
        expect(document.getElementById(active ?? '')?.textContent).toBe(
            'Atelier Durand Menuiserie'
        )
    })

    it('walks the options with the arrow keys, round the end', () => {
        renderCombobox()

        press('ArrowDown')
        const activeText = () =>
            document.getElementById(
                getInput().getAttribute('aria-activedescendant') ?? ''
            )?.textContent

        expect(activeText()).toBe('Atelier Durand Menuiserie')
        press('ArrowUp')
        expect(activeText()).toBe('Imprimerie du Centre')
        press('ArrowDown')
        expect(activeText()).toBe('Atelier Durand Menuiserie')
    })

    it('chooses the active option with Enter', () => {
        const { onChange } = renderCombobox()

        type('impr')
        press('Enter')

        expect(onChange).toHaveBeenLastCalledWith('imprimerie')
        expect(getInput().value).toBe('Imprimerie du Centre')
        expect(getInput().getAttribute('aria-expanded')).toBe('false')
    })

    it('chooses an option with a click', () => {
        const { onChange } = renderCombobox()

        fireEvent.click(getInput())
        fireEvent.click(screen.getByText('Cabinet Lefèvre Conseil'))

        expect(onChange).toHaveBeenLastCalledWith('lefevre')
    })

    it('shows the chosen option in the field and ticks it in the list', () => {
        renderCombobox({ value: 'lefevre' })

        expect(getInput().value).toBe('Cabinet Lefèvre Conseil')
        fireEvent.click(getInput())
        expect(
            screen
                .getByRole('option', { name: /Lefèvre/ })
                .querySelector('.fr-icon-check-line')
        ).not.toBeNull()
    })

    it('undoes the choice when the text is changed', () => {
        const { onChange } = renderCombobox({ value: 'lefevre' })

        type('Cabinet')

        expect(onChange).toHaveBeenLastCalledWith(null)
    })

    it('clears the field with its button, and reopens the list', () => {
        const { onChange } = renderCombobox({ value: 'lefevre' })

        fireEvent.click(
            screen.getByRole('button', { name: 'Effacer « Fournisseur »' })
        )

        expect(getInput().value).toBe('')
        expect(onChange).toHaveBeenLastCalledWith(null)
        expect(optionTexts()).toHaveLength(3)
        expect(document.activeElement).toBe(getInput())
    })

    it('closes the list with Escape, then clears the field', () => {
        renderCombobox()

        type('Cab')
        press('Escape')
        expect(getInput().getAttribute('aria-expanded')).toBe('false')
        expect(getInput().value).toBe('Cab')

        press('Escape')
        expect(getInput().value).toBe('')
    })

    it('keeps Escape from reaching what is around the field', () => {
        const outside = vi.fn()
        renderCombobox()
        document.addEventListener('keydown', outside)

        type('Cab')
        press('Escape')

        expect(outside).not.toHaveBeenCalled()
        document.removeEventListener('keydown', outside)
    })

    it('ends the list with the action, reached with the arrows too', () => {
        const onActivate = vi.fn()
        renderCombobox({
            action: {
                label: (query) => `Ajouter « ${query} »`,
                onActivate,
            },
        })

        type('zzz')
        expect(optionTexts()).toEqual(['Ajouter « zzz »'])

        press('ArrowDown')
        press('Enter')
        expect(onActivate).toHaveBeenCalledWith('zzz')
    })

    it('runs the action with Enter when nothing matches', () => {
        const onActivate = vi.fn()
        renderCombobox({
            action: { label: () => 'Ajouter', onActivate },
        })

        type('zzz')
        press('Escape')
        fireEvent.click(getInput())
        press('Enter')

        expect(onActivate).toHaveBeenCalledWith('zzz')
    })

    it('leaves the action out when told to', () => {
        renderCombobox({
            action: {
                label: () => 'Ajouter',
                onActivate: vi.fn(),
                hidden: (query) => query === 'Imprimerie du Centre',
            },
        })

        type('Imprimerie du Centre')

        expect(optionTexts()).toEqual(['Imprimerie du Centre'])
    })

    it('chooses the option the text names exactly when the field is left', () => {
        const { onChange } = renderCombobox()

        type('imprimerie du centre')
        fireEvent.blur(getInput())

        expect(onChange).toHaveBeenLastCalledWith('imprimerie')
    })

    it('asks to choose when the field is left with an unknown text', () => {
        renderCombobox()

        type('Cab')
        fireEvent.blur(getInput())

        expect(
            screen.getByText('Choisissez une valeur dans la liste.')
        ).toBeDefined()
        expect(getInput().getAttribute('aria-describedby')).not.toBeNull()
    })

    it('announces how many options match', async () => {
        renderCombobox()

        type('a')

        expect(await screen.findByText('2 résultats.')).toBeDefined()
    })
})
