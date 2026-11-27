// DSFR's liste déroulante: a native `<select class="fr-select">`, so no CSS of
// its own.
import '@gouvfr/dsfr/dist/component/form/form.main.min.css'
import '@gouvfr/dsfr/dist/component/select/select.main.min.css'

import { useId } from 'react'
import type {
    SelectGroup,
    SelectItem,
    SelectOption,
    SelectProps,
} from './Select.types'

function isGroup<T>(item: SelectItem<T>): item is SelectGroup<T> {
    return 'options' in item
}

// `<option>` values are strings, so the DOM holds the option's position, traded
// back for its `T`.
// The dash keeps a grouped option ("1-0") from colliding with an ungrouped one
// ("1").
function optionKey(itemIndex: number, optionIndex?: number) {
    return optionIndex === undefined
        ? `${itemIndex}`
        : `${itemIndex}-${optionIndex}`
}

export default function Select<T>({
    label,
    description,
    options,
    value,
    onChange,
    placeholder = 'Sélectionner une option',
    disabled = false,
    message,
}: SelectProps<T>) {
    const id = useId()
    const selectId = `${id}-select`
    const descriptionId = `${id}-description`
    const messagesId = `${id}-messages`

    // Must build keys exactly as the render below does.
    const entries = options.flatMap((item, itemIndex) =>
        isGroup(item)
            ? item.options.map((option, optionIndex) => ({
                  key: optionKey(itemIndex, optionIndex),
                  option,
              }))
            : [{ key: optionKey(itemIndex), option: item }]
    )

    // A value no longer in `options` finds nothing and falls back to the
    // placeholder.
    const selectedKey = entries.find(
        (entry) => entry.option.value === value
    )?.key

    const groupClassName = [
        'fr-select-group',
        message && `fr-select-group--${message.severity}`,
    ]
        .filter(Boolean)
        .join(' ')

    function reportSelection(key: string) {
        const entry = entries.find((candidate) => candidate.key === key)
        if (entry) onChange(entry.option.value)
    }

    function renderOption(option: SelectOption<T>, key: string) {
        return (
            <option key={key} value={key} disabled={option.disabled}>
                {option.label}
            </option>
        )
    }

    return (
        <div className={groupClassName}>
            <label className="fr-label" htmlFor={selectId}>
                {label}
                {description && (
                    <span className="fr-hint-text" id={descriptionId}>
                        {description}
                    </span>
                )}
            </label>
            <select
                className="fr-select"
                id={selectId}
                value={selectedKey ?? ''}
                disabled={disabled}
                // Not the hint: it is inside the `<label>`, so already part of
                // the accessible name.
                aria-describedby={messagesId}
                aria-invalid={message?.severity === 'error' || undefined}
                onChange={(event) => reportSelection(event.target.value)}
            >
                <option value="" disabled hidden>
                    {placeholder}
                </option>
                {options.map((item, itemIndex) =>
                    isGroup(item) ? (
                        <optgroup
                            key={item.id}
                            label={item.label}
                            disabled={item.disabled}
                        >
                            {item.options.map((option, optionIndex) =>
                                renderOption(
                                    option,
                                    optionKey(itemIndex, optionIndex)
                                )
                            )}
                        </optgroup>
                    ) : (
                        renderOption(item, optionKey(itemIndex))
                    )
                )}
            </select>
            {/* Always rendered: `aria-live` only announces changes to a
                region already in the page. */}
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
        </div>
    )
}
