// Unlike the "liste déroulante riche" MultiSelect has to compose out of
// primitives, DSFR 1.14.4 ships the liste déroulante itself: a native
// `<select>` wearing `fr-select`, inside an `fr-select-group`. So this
// component is that element and nothing more — the open list, the keyboard, the
// type-ahead, the mobile picker and the accessibility all come from the browser
// rather than from code here. That is also why it needs no CSS file of its own.
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

// A native `<option>` can only carry a string, but the component hands back the
// caller's own `T`. So the string it puts in the DOM is a position rather than
// a value: it means nothing outside this render, and is only ever traded back
// for the option it was built from. The dash is what keeps a grouped option
// ("1-0") from ever colliding with an ungrouped one ("1").
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

    // Every option in the list, each next to the key standing in for it in the
    // DOM. Built the same way it is rendered below, so the two always agree.
    const entries = options.flatMap((item, itemIndex) =>
        isGroup(item)
            ? item.options.map((option, optionIndex) => ({
                  key: optionKey(itemIndex, optionIndex),
                  option,
              }))
            : [{ key: optionKey(itemIndex), option: item }]
    )

    // Read off the list rather than off `value`, so a value the caller kept
    // around for an option that is no longer offered does not draw as selected:
    // it finds nothing, falls back to the placeholder, and the list says what it
    // actually holds. Identity, like the values themselves are matched
    // everywhere else in this component and in MultiSelect.
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
        // Nothing to report if the key matches no option — the placeholder is
        // not pickable, so this only guards against a stale event.
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
                // Controlled, so React needs a value for every render. The empty
                // string is the placeholder's own value, which is where an
                // unmatched selection lands.
                value={selectedKey ?? ''}
                disabled={disabled}
                // Points at the messages block rather than at the hint: the hint
                // already sits inside the `<label>`, so it is part of the
                // accessible name and reading it again here would double it up.
                aria-describedby={messagesId}
                // Not something DSFR spells out in its markup, but a list in
                // error should say so to a screen reader and not only in colour.
                aria-invalid={message?.severity === 'error' || undefined}
                onChange={(event) => reportSelection(event.target.value)}
            >
                {/* `disabled hidden` is DSFR's own placeholder: it shows while
                    nothing is picked, and drops out of the open list once the
                    user goes looking — a prompt rather than an option. React
                    drives which line is shown through `value` above, so there is
                    no `selected` attribute here. */}
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
            {/* Rendered even with nothing to say. `aria-live` announces changes
                to a region that was already on the page, so a messages block
                that only appears along with its message appears too late to be
                read out — the user would be told nothing at the moment the list
                falls into error. */}
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
