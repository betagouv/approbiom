import '@gouvfr/dsfr/dist/component/form/form.main.min.css'

import { useId } from 'react'
import Radio from './Radio'
import type { RadioGroupProps } from './Radio.types'

function formValue<T>(value: T) {
    return typeof value === 'string' || typeof value === 'number'
        ? String(value)
        : undefined
}

export default function RadioGroup<T>({
    legend,
    description,
    options,
    value,
    onChange,
    name,
    size,
    inline = false,
    disabled = false,
    message,
}: RadioGroupProps<T>) {
    const id = useId()
    const legendId = `${id}-legend`
    const messagesId = `${id}-messages`

    const groupName = name ?? id

    const fieldsetClassName = [
        'fr-fieldset',
        message && `fr-fieldset--${message.severity}`,
    ]
        .filter(Boolean)
        .join(' ')

    const elementClassName = [
        'fr-fieldset__element',
        inline && 'fr-fieldset__element--inline',
    ]
        .filter(Boolean)
        .join(' ')

    return (
        // `disabled` on the `<fieldset>` rather than passed down to each radio:
        // it disables every control inside natively, which DSFR's own
        // `input:disabled` rules then pick up, so the greyed-out look comes for
        // free. The legend is exempt by spec, so the question stays readable.
        <fieldset
            className={fieldsetClassName}
            disabled={disabled}
            // `group` is already the implicit role of a `<fieldset>`. Spelling
            // it out is what DSFR does, and it costs nothing: assistive
            // technology that would otherwise treat the element as a plain
            // container announces the group and its name.
            role="group"
            // The name of the group is its legend *and* whatever the messages
            // block currently says. That is deliberate: a user arriving in a
            // group in error hears the question and the reason it is in error
            // together, rather than having to go looking for the text below the
            // options.
            aria-labelledby={`${legendId} ${messagesId}`}
        >
            {/* `--regular` takes the legend off the bold a `<legend>` is given
                by default. A fieldset normally groups fields that each carry
                their own label, so its legend is a heading over them; here the
                options have no label of their own and the legend is read as the
                label of the group, so it is drawn as one. */}
            <legend
                className="fr-fieldset__legend fr-fieldset__legend--regular"
                id={legendId}
            >
                {legend}
                {description && (
                    <span className="fr-hint-text">{description}</span>
                )}
            </legend>
            {options.map((option, index) => (
                <div className={elementClassName} key={index}>
                    <Radio
                        name={groupName}
                        label={option.label}
                        description={option.description}
                        value={formValue(option.value)}
                        // Identity, like the values themselves are matched
                        // everywhere else in this component.
                        checked={option.value === value}
                        disabled={disabled || option.disabled}
                        size={size}
                        // The radio has no value to report — it only knows it
                        // has just been picked — so the option it was built
                        // from is what gets handed back.
                        onChange={() => onChange(option.value)}
                    />
                </div>
            ))}
            {/* Rendered even with nothing to say. `aria-live` announces changes
                to a region that was already on the page, so a messages block
                that only appears along with its message appears too late to be
                read out — the user would be told nothing at the moment the
                group falls into error. */}
            <div
                className="fr-messages-group"
                id={messagesId}
                aria-live="polite"
            >
                {message && (
                    <p className={`fr-message fr-message--${message.severity}`}>
                        {message.text}
                    </p>
                )}
            </div>
        </fieldset>
    )
}
