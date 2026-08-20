import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Toggle from './Toggle'

afterEach(() => {
    cleanup()
})

function ControlledToggle({ initial = false }: { initial?: boolean }) {
    const [checked, setChecked] = useState(initial)

    return (
        <Toggle
            label="Ce plan est lauréat"
            checked={checked}
            onChange={setChecked}
        />
    )
}

// A DSFR toggle is a real `<input type="checkbox">` under its paint, so that is
// the role it is queried by.
const getToggle = () =>
    screen.getByRole<HTMLInputElement>('checkbox', {
        name: 'Ce plan est lauréat',
    })

describe('Toggle', () => {
    it('renders unchecked when it is given false', () => {
        render(<ControlledToggle />)

        expect(getToggle().checked).toBe(false)
    })

    it('renders checked when it is given true', () => {
        render(<ControlledToggle initial />)

        expect(getToggle().checked).toBe(true)
    })

    it('reports the new state when it is clicked', () => {
        const onChange = vi.fn()
        render(
            <Toggle
                label="Avis CRB requis"
                checked={false}
                onChange={onChange}
            />
        )

        fireEvent.click(screen.getByRole('checkbox'))

        expect(onChange).toHaveBeenCalledWith(true)
    })

    it('reports false when a checked toggle is clicked', () => {
        const onChange = vi.fn()
        render(<Toggle label="Avis CRB requis" checked onChange={onChange} />)

        fireEvent.click(screen.getByRole('checkbox'))

        expect(onChange).toHaveBeenCalledWith(false)
    })

    it('stays on the state it is given until the parent changes it', () => {
        const onChange = vi.fn()
        render(
            <Toggle
                label="Avis CRB requis"
                checked={false}
                onChange={onChange}
            />
        )

        fireEvent.click(screen.getByRole('checkbox'))

        // Controlled: the click is reported, it does not move the switch by
        // itself. Only the parent can do that.
        expect(screen.getByRole<HTMLInputElement>('checkbox').checked).toBe(
            false
        )
    })

    it('describes itself with its description rather than naming itself with it', () => {
        render(
            <Toggle
                label="Avis CRB requis"
                description="Un avis du CRB est attendu"
                checked={false}
                onChange={() => {}}
            />
        )

        const toggle = screen.getByRole<HTMLInputElement>('checkbox', {
            name: 'Avis CRB requis',
        })
        const description = document.querySelector('.fr-hint-text')
        expect(toggle.getAttribute('aria-describedby')).toBe(description?.id)
    })

    it('leaves the state text off unless it is asked for', () => {
        render(<ControlledToggle />)

        // DSFR only paints « Activé » / « Désactivé » when both attributes are
        // there, so the bare switch of the model needs neither.
        const label = document.querySelector('.fr-toggle__label')
        expect(label?.hasAttribute('data-fr-checked-label')).toBe(false)
        expect(label?.hasAttribute('data-fr-unchecked-label')).toBe(false)
    })

    it('sets both state attributes together when the state text is asked for', () => {
        render(
            <Toggle
                label="Ce plan est lauréat"
                checked={false}
                onChange={() => {}}
                showState
            />
        )

        const label = document.querySelector('.fr-toggle__label')
        expect(label?.getAttribute('data-fr-unchecked-label')).toBe('Désactivé')
        expect(label?.getAttribute('data-fr-checked-label')).toBe('Activé')
    })

    it('puts the label first when asked', () => {
        render(
            <Toggle
                label="Ce plan est lauréat"
                checked={false}
                onChange={() => {}}
                labelLeft
            />
        )

        expect(document.querySelector('.fr-toggle')?.className).toContain(
            'fr-toggle--label-left'
        )
    })

    it('disables the switch when asked', () => {
        render(
            <Toggle
                label="Ce plan est lauréat"
                checked={false}
                onChange={() => {}}
                disabled
            />
        )

        expect(screen.getByRole<HTMLInputElement>('checkbox').disabled).toBe(
            true
        )
    })
})
