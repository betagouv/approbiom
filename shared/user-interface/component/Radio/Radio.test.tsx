import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Radio from './Radio'

afterEach(() => {
    cleanup()
})

describe('Radio', () => {
    it('names the radio after its label', () => {
        render(
            <Radio
                name="nature"
                label="Eau"
                checked={false}
                onChange={() => {}}
            />
        )

        expect(screen.getByRole('radio', { name: 'Eau' })).toBeDefined()
    })

    it('reads the description into the accessible name', () => {
        render(
            <Radio
                name="nature"
                label="Sol"
                description="Terres agricoles"
                checked={false}
                onChange={() => {}}
            />
        )

        // The hint is inside the label, so it is part of the name rather than a
        // separate announcement — the two are read together or not at all.
        // Matched loosely between the two: what separates them is down to how
        // the name is assembled, and only the two halves being there matters.
        expect(
            screen.getByRole('radio', { name: /^Sol\s*Terres agricoles$/ })
        ).toBeDefined()
    })

    it('ties the label to the input', () => {
        const onChange = vi.fn()
        render(
            <Radio
                name="nature"
                label="Eau"
                checked={false}
                onChange={onChange}
            />
        )

        // Clicking the text has to reach the control: the input itself is
        // transparent and 1.5rem wide, so the label is most of what there is to
        // aim at.
        fireEvent.click(screen.getByText('Eau'))

        expect(onChange).toHaveBeenCalledTimes(1)
    })

    it('reports being picked', () => {
        const onChange = vi.fn()
        render(
            <Radio
                name="nature"
                label="Eau"
                checked={false}
                onChange={onChange}
            />
        )

        fireEvent.click(screen.getByRole('radio'))

        expect(onChange).toHaveBeenCalledTimes(1)
    })

    it('carries the form value it is given', () => {
        render(
            <Radio
                name="nature"
                label="Eau"
                value="eau"
                checked={false}
                onChange={() => {}}
            />
        )

        expect(screen.getByRole<HTMLInputElement>('radio').value).toBe('eau')
    })

    it('cannot be picked when disabled', () => {
        render(
            <Radio
                name="nature"
                label="Eau"
                checked={false}
                disabled
                onChange={() => {}}
            />
        )

        // The state on the control itself rather than a click that goes
        // nowhere: it is the browser that refuses the click, and jsdom does not
        // stand in for it here — dispatching one by hand reaches the handler
        // whatever the control says.
        expect(screen.getByRole<HTMLInputElement>('radio').disabled).toBe(true)
    })

    it('renders at the medium size by default', () => {
        render(
            <Radio
                name="nature"
                label="Eau"
                checked={false}
                onChange={() => {}}
            />
        )

        // DSFR has no `--md` class: medium is the plain `fr-radio-group`, and
        // the assertion is that nothing narrows it.
        const group = screen.getByRole('radio').closest('.fr-radio-group')
        expect(group?.className).toBe('fr-radio-group')
    })

    it('renders at the small size when asked', () => {
        render(
            <Radio
                name="nature"
                label="Eau"
                size="sm"
                checked={false}
                onChange={() => {}}
            />
        )

        const group = screen.getByRole('radio').closest('.fr-radio-group')
        expect(group?.className).toContain('fr-radio-group--sm')
    })

    it('puts the label straight after the input', () => {
        render(
            <Radio
                name="nature"
                label="Eau"
                checked={false}
                onChange={() => {}}
            />
        )

        expect(screen.getByRole('radio').nextElementSibling).toBe(
            screen.getByText('Eau')
        )
    })
})
