// DSFR ships no combobox: its « liste déroulante riche » is design only. This one
// is built from DSFR parts (input group, buttons, messages, icons) following the
// WAI-ARIA « combobox with listbox popup » pattern: the focus stays in the input
// and `aria-activedescendant` points at the option the arrow keys reached.
import '@gouvfr/dsfr/dist/component/form/form.main.min.css'
import '@gouvfr/dsfr/dist/component/input/input.main.min.css'
import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-arrows/icons-arrows.main.min.css'
import './Combobox.css'

import {
    useEffect,
    useId,
    useImperativeHandle,
    useRef,
    useState,
    type ReactNode,
} from 'react'
import type { ComboboxOption, ComboboxProps } from './Combobox.types'

const normalize = (text: string) =>
    text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

function highlighted(label: string, query: string): ReactNode {
    const at = normalize(label).indexOf(normalize(query))
    // Lowercasing can change the length of a few characters: positions found on
    // the normalised text would no longer fall on the right letters.
    if (!query || at === -1 || normalize(label).length !== label.length)
        return label

    return (
        <>
            {label.slice(0, at)}
            <strong>{label.slice(at, at + query.length)}</strong>
            {label.slice(at + query.length)}
        </>
    )
}

function countMessage(count: number, hasAction: boolean): string {
    const found =
        count === 0
            ? 'Aucun résultat.'
            : count === 1
              ? '1 résultat.'
              : `${count} résultats.`

    return hasAction ? `${found} Option d'ajout en fin de liste.` : found
}

export default function Combobox<T>({
    label,
    hint,
    options,
    value,
    onChange,
    placeholder,
    action,
    message,
    ref,
}: ComboboxProps<T>) {
    const id = useId()
    const ids = {
        label: `${id}-label`,
        input: `${id}-input`,
        listbox: `${id}-listbox`,
        messages: `${id}-messages`,
        option: (index: number) => `${id}-option-${index}`,
        action: `${id}-option-action`,
    }

    const selected = options.find((option) => option.value === value) ?? null

    const [query, setQuery] = useState(selected?.label ?? '')
    const [open, setOpen] = useState(false)
    // -1 for none, an option's index, or `matches.length` for the action line.
    const [active, setActive] = useState(-1)
    const [leftUnchosen, setLeftUnchosen] = useState(false)
    const [announcement, setAnnouncement] = useState('')

    const rootRef = useRef<HTMLDivElement>(null)
    const ownInputRef = useRef<HTMLInputElement>(null)
    // Activating the action takes the focus elsewhere on purpose: that blur is
    // not the user leaving the field with an unchosen text.
    const actionActivated = useRef(false)

    // A choice made from outside — a new option created then chosen — shows in
    // the field like one made in the list.
    const selectedLabel = selected?.label
    const [shownLabel, setShownLabel] = useState(selectedLabel)
    if (selectedLabel !== shownLabel) {
        setShownLabel(selectedLabel)
        if (selectedLabel !== undefined) setQuery(selectedLabel)
    }

    useImperativeHandle(ref, () => ({
        focus: () => ownInputRef.current?.focus(),
    }))

    const trimmed = query.trim()
    const matches = trimmed
        ? options.filter((option) =>
              normalize(option.label).includes(normalize(trimmed))
          )
        : options
    const hasAction = action !== undefined && !action.hidden?.(trimmed)
    const lineCount = matches.length + (hasAction ? 1 : 0)

    const activeId =
        open && active !== -1
            ? active < matches.length
                ? ids.option(active)
                : ids.action
            : undefined

    useEffect(() => {
        if (activeId)
            document
                .getElementById(activeId)
                ?.scrollIntoView?.({ block: 'nearest' })
    }, [activeId])

    // Emptied first, so the same sentence twice in a row is read twice.
    function announce(text: string) {
        setAnnouncement('')
        setTimeout(() => setAnnouncement(text), 50)
    }

    function openList(at: number, shown = matches.length) {
        setOpen(true)
        setActive(at)
        announce(countMessage(shown, hasAction))
    }

    function close() {
        setOpen(false)
        setActive(-1)
    }

    function choose(option: ComboboxOption<T>) {
        setQuery(option.label)
        setLeftUnchosen(false)
        close()
        onChange(option.value)
        announce(`« ${option.label} » sélectionné.`)
    }

    function activateAction() {
        if (!action) return

        actionActivated.current = true
        close()
        action.onActivate(trimmed)
    }

    function pick(line: number) {
        if (line < matches.length) choose(matches[line])
        else activateAction()
    }

    function clear() {
        setQuery('')
        setLeftUnchosen(false)
        if (value !== null) onChange(null)
        setOpen(true)
        setActive(-1)
        announce('Saisie effacée.')
        ownInputRef.current?.focus()
    }

    function type(text: string) {
        setQuery(text)
        setLeftUnchosen(false)
        if (value !== null) onChange(null)

        const typed = text.trim()
        const shown = typed
            ? options.filter((option) =>
                  normalize(option.label).includes(normalize(typed))
              ).length
            : options.length
        openList(typed ? 0 : -1, shown)
    }

    function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            if (lineCount === 0) return

            const down = event.key === 'ArrowDown'
            if (!open) return openList(down ? 0 : lineCount - 1)

            setActive(
                active === -1
                    ? down
                        ? 0
                        : lineCount - 1
                    : (active + (down ? 1 : -1) + lineCount) % lineCount
            )
        } else if (event.key === 'Enter') {
            if (open && active !== -1) {
                event.preventDefault()
                pick(active)
            } else if (open && matches.length === 0 && hasAction) {
                event.preventDefault()
                activateAction()
            }
        } else if (event.key === 'Escape') {
            // Handled here, so a dialog around the field stays open.
            if (open) {
                event.preventDefault()
                event.stopPropagation()
                close()
            } else if (query) {
                event.preventDefault()
                event.stopPropagation()
                clear()
                close()
            }
        } else if (event.key === 'Tab') {
            close()
        }
    }

    function onBlur(event: React.FocusEvent<HTMLDivElement>) {
        if (rootRef.current?.contains(event.relatedTarget)) return

        close()
        if (actionActivated.current) {
            actionActivated.current = false
            return
        }
        if (!trimmed || selected?.label === query) return

        const exact = options.find(
            (option) => normalize(option.label) === normalize(trimmed)
        )
        if (exact) choose(exact)
        else setLeftUnchosen(true)
    }

    const shownMessage = leftUnchosen
        ? {
              severity: 'error' as const,
              text: action
                  ? 'Choisissez une valeur dans la liste ou ajoutez-en une.'
                  : 'Choisissez une valeur dans la liste.',
          }
        : message

    return (
        <div
            className={`fr-input-group shared-combobox${shownMessage ? ` fr-input-group--${shownMessage.severity}` : ''}`}
        >
            <label className="fr-label" htmlFor={ids.input} id={ids.label}>
                {label}
                {hint !== undefined && (
                    <span className="fr-hint-text">{hint}</span>
                )}
            </label>
            <div
                className="shared-combobox__field"
                ref={rootRef}
                onBlur={onBlur}
            >
                <input
                    ref={ownInputRef}
                    id={ids.input}
                    className={`fr-input shared-combobox__input${shownMessage ? ` fr-input--${shownMessage.severity}` : ''}`}
                    type="text"
                    role="combobox"
                    autoComplete="off"
                    aria-autocomplete="list"
                    aria-expanded={open}
                    aria-controls={ids.listbox}
                    aria-activedescendant={activeId}
                    aria-describedby={shownMessage ? ids.messages : undefined}
                    placeholder={placeholder}
                    value={query}
                    onChange={(event) => type(event.target.value)}
                    onClick={() => {
                        if (!open) openList(-1)
                    }}
                    onKeyDown={onKeyDown}
                />
                <div className="shared-combobox__buttons">
                    {query && (
                        <button
                            type="button"
                            className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-icon-close-line"
                            title={`Effacer « ${label} »`}
                            onClick={clear}
                        >
                            Effacer « {label} »
                        </button>
                    )}
                    <button
                        type="button"
                        tabIndex={-1}
                        aria-hidden="true"
                        className={`fr-btn fr-btn--tertiary-no-outline fr-btn--sm ${open ? 'fr-icon-arrow-up-s-line' : 'fr-icon-arrow-down-s-line'}`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                            ownInputRef.current?.focus()
                            if (open) close()
                            else openList(-1)
                        }}
                    >
                        {open ? 'Fermer la liste' : 'Ouvrir la liste'}
                    </button>
                </div>
                <div className="shared-combobox__panel" hidden={!open}>
                    {/* The mouse never takes the focus from the input. */}
                    <ul
                        id={ids.listbox}
                        role="listbox"
                        aria-labelledby={ids.label}
                        className="fr-raw-list shared-combobox__list"
                        onMouseDown={(event) => event.preventDefault()}
                    >
                        {open &&
                            matches.map((option, index) => {
                                const isSelected = option === selected

                                return (
                                    <li
                                        key={index}
                                        id={ids.option(index)}
                                        role="option"
                                        aria-selected={active === index}
                                        className={`shared-combobox__option${active === index ? ' shared-combobox__option--active' : ''}${isSelected ? ' shared-combobox__option--selected' : ''}`}
                                        onClick={() => choose(option)}
                                        onMouseMove={() => {
                                            if (active !== index)
                                                setActive(index)
                                        }}
                                    >
                                        <span>
                                            {highlighted(option.label, trimmed)}
                                        </span>
                                        {isSelected && (
                                            <span
                                                className="fr-icon-check-line fr-icon--sm"
                                                aria-hidden="true"
                                            />
                                        )}
                                    </li>
                                )
                            })}
                        {open && trimmed && matches.length === 0 && (
                            <li
                                role="presentation"
                                className="shared-combobox__empty"
                            >
                                Aucun résultat ne correspond à « {trimmed} ».
                            </li>
                        )}
                        {open && hasAction && (
                            <li
                                id={ids.action}
                                role="option"
                                aria-selected={active === matches.length}
                                className={`shared-combobox__action${active === matches.length ? ' shared-combobox__option--active' : ''}`}
                                onClick={activateAction}
                                onMouseMove={() => {
                                    if (active !== matches.length)
                                        setActive(matches.length)
                                }}
                            >
                                <span
                                    className="fr-icon-add-line fr-icon--sm"
                                    aria-hidden="true"
                                />
                                <span>{action.label(trimmed)}</span>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
            <div
                className="fr-messages-group"
                id={ids.messages}
                aria-live="polite"
            >
                {shownMessage && (
                    <p
                        className={`fr-message fr-message--${shownMessage.severity}`}
                    >
                        {shownMessage.text}
                    </p>
                )}
            </div>
            <div className="fr-sr-only" role="status" aria-live="polite">
                {announcement}
            </div>
        </div>
    )
}
