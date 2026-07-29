import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import RadioGroup from './RadioGroup'
import type { RadioGroupProps, RadioOption } from './Radio.types'

const natures: readonly RadioOption<string>[] = [
    { value: 'eau', label: 'Eau' },
    { value: 'air', label: 'Air' },
    { value: 'sol', label: 'Sol', description: 'Terres agricoles' },
]

afterEach(() => {
    cleanup()
})

type ControlledProps = Omit<
    RadioGroupProps<string>,
    'legend' | 'options' | 'value' | 'onChange'
> & {
    initialValue?: string | null
    options?: readonly RadioOption<string>[]
}

function ControlledRadioGroup({
    initialValue = null,
    options = natures,
    ...rest
}: ControlledProps) {
    const [value, setValue] = useState<string | null>(initialValue)

    return (
        <RadioGroup
            legend="Nature de la ressource"
            description="Une seule réponse possible"
            options={options}
            value={value}
            onChange={setValue}
            {...rest}
        />
    )
}

const getRadio = (name: string | RegExp) =>
    screen.getByRole<HTMLInputElement>('radio', { name })

describe('RadioGroup', () => {
    it('renders one radio per option', () => {
        render(<ControlledRadioGroup />)

        expect(screen.getAllByRole('radio')).toHaveLength(3)
        expect(getRadio('Eau')).toBeDefined()
        expect(getRadio('Air')).toBeDefined()
        // The option's own hint, read as part of its name.
        expect(getRadio(/^Sol\s*Terres agricoles$/)).toBeDefined()
    })

    it('names the group after its legend and description', () => {
        render(<ControlledRadioGroup />)

        expect(
            screen.getByRole('group', {
                name: /^Nature de la ressource\s*Une seule réponse possible$/,
            })
        ).toBeDefined()
    })

    it('starts with nothing selected when it is given no value', () => {
        render(<ControlledRadioGroup />)

        for (const radio of screen.getAllByRole<HTMLInputElement>('radio')) {
            expect(radio.checked).toBe(false)
        }
    })

    it('selects the option matching the value it is given', () => {
        render(<ControlledRadioGroup initialValue="air" />)

        expect(getRadio('Air').checked).toBe(true)
        expect(getRadio('Eau').checked).toBe(false)
    })

    it('reports the value of the option the user picks', () => {
        render(<ControlledRadioGroup />)

        fireEvent.click(getRadio('Eau'))

        expect(getRadio('Eau').checked).toBe(true)
    })

    it('moves the selection when another option is picked', () => {
        render(<ControlledRadioGroup initialValue="eau" />)

        fireEvent.click(getRadio('Air'))

        expect(getRadio('Air').checked).toBe(true)
        // The browser clears the old radio without telling anyone, so this is
        // the group's own doing — it holds the selection, the radios do not.
        expect(getRadio('Eau').checked).toBe(false)
    })

    it('groups the radios under one name', () => {
        render(<ControlledRadioGroup />)

        // What makes the browser treat the options as alternatives: one name
        // is what gives the group its arrow-key navigation and what makes
        // picking one clear the others.
        const names = screen
            .getAllByRole<HTMLInputElement>('radio')
            .map((radio) => radio.name)

        expect(new Set(names).size).toBe(1)
    })

    it('takes the name it is given', () => {
        render(<ControlledRadioGroup name="nature" />)

        expect(getRadio('Eau').name).toBe('nature')
    })

    it('carries a form value for the options that have one', () => {
        render(<ControlledRadioGroup />)

        expect(getRadio('Eau').value).toBe('eau')
    })

    it('renders an option that cannot be picked', () => {
        render(
            <ControlledRadioGroup
                options={[
                    { value: 'eau', label: 'Eau' },
                    { value: 'air', label: 'Air', disabled: true },
                ]}
            />
        )

        expect(getRadio('Air').disabled).toBe(true)
        expect(getRadio('Eau').disabled).toBe(false)
    })

    it('disables every option when the group is disabled', () => {
        render(<ControlledRadioGroup disabled />)

        // Set on the `<fieldset>` rather than on each radio, so this is the
        // assertion that the native inheritance is what carries it — and that
        // DSFR's `input:disabled` rules will therefore match.
        for (const radio of screen.getAllByRole<HTMLInputElement>('radio')) {
            expect(radio.disabled).toBe(true)
        }
    })

    it('renders at the small size when asked', () => {
        render(<ControlledRadioGroup size="sm" />)

        for (const radio of screen.getAllByRole('radio')) {
            expect(radio.closest('.fr-radio-group')?.className).toContain(
                'fr-radio-group--sm'
            )
        }
    })

    it('stacks the options by default', () => {
        render(<ControlledRadioGroup />)

        const element = getRadio('Eau').closest('.fr-fieldset__element')
        expect(element?.className).toBe('fr-fieldset__element')
    })

    it('lays the options out in a row when asked', () => {
        render(<ControlledRadioGroup inline />)

        for (const radio of screen.getAllByRole('radio')) {
            expect(radio.closest('.fr-fieldset__element')?.className).toContain(
                'fr-fieldset__element--inline'
            )
        }
    })

    it('keeps an empty live region when there is nothing to say', () => {
        render(<ControlledRadioGroup />)

        // The region has to be on the page before the message is, or the
        // message lands in a region that was not being watched and is never
        // announced.
        const messages = document.querySelector('.fr-messages-group')
        expect(messages?.getAttribute('aria-live')).toBe('polite')
        expect(messages?.textContent).toBe('')
        expect(screen.getByRole('group').className).toBe('fr-fieldset')
    })

    it('shows an error message and marks the group in error', () => {
        render(
            <ControlledRadioGroup
                message={{
                    severity: 'error',
                    text: 'Sélectionnez une nature',
                }}
            />
        )

        expect(screen.getByText('Sélectionnez une nature').className).toBe(
            'fr-message fr-message--error'
        )
        expect(screen.getByRole('group').className).toContain(
            'fr-fieldset--error'
        )
    })

    it('reads the message as part of the name of the group', () => {
        render(
            <ControlledRadioGroup
                message={{
                    severity: 'error',
                    text: 'Sélectionnez une nature',
                }}
            />
        )

        // A user arriving in the group hears the question and the reason it is
        // in error together, rather than having to go looking for the text
        // under the options.
        expect(
            screen.getByRole('group', { name: /Sélectionnez une nature/ })
        ).toBeDefined()
    })

    it('shows a success message and marks the group valid', () => {
        render(
            <ControlledRadioGroup
                initialValue="eau"
                message={{ severity: 'valid', text: 'Nature enregistrée' }}
            />
        )

        expect(screen.getByText('Nature enregistrée').className).toBe(
            'fr-message fr-message--valid'
        )
        expect(screen.getByRole('group').className).toContain(
            'fr-fieldset--valid'
        )
    })

    it('draws the legend in a regular weight', () => {
        render(<ControlledRadioGroup />)

        // A `<legend>` is bold by default, which reads as a heading over
        // labelled fields. Here it is the label of the group itself.
        const legend = document.querySelector('legend')
        expect(legend?.className).toContain('fr-fieldset__legend--regular')
    })
})
