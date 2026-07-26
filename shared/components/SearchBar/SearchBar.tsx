import '@gouvfr/dsfr/dist/component/input/input.main.min.css'
import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/component/search/search.main.min.css'

import './SearchBar.css'
import type { SearchBarProps } from './SearchBar.types'
import { useEffect, useId, useRef, useState } from 'react'

export default function SearchBar<T>({
    label,
    options = [],
    placeholder,
    onSearch,
    onSelect,
}: SearchBarProps<T>) {
    const id = useId()
    const inputId = `${id}-search-input`
    const panelId = `${id}-search-panel`
    const displayedPlaceholder = placeholder ?? 'Rechercher'

    const [isRequested, setIsRequested] = useState(false)
    const [query, setQuery] = useState('')

    // Wraps the field and the panel both, so "outside" is one containment test
    // rather than two — and clicking the field itself never reaches the handler
    // below, leaving it open.
    const rootRef = useRef<HTMLDivElement>(null)

    const visibleOptions = options.filter((option) =>
        option.label.toLowerCase().includes(query.trim().toLowerCase())
    )

    const isOpen = isRequested && visibleOptions.length > 0

    // Escape is the keyboard's half of dismissing the panel: the click-outside
    // below is mouse and touch only. Focus is already in the input and stays
    // there, so nothing has to be put back.
    function closeOnEscape(event: React.KeyboardEvent) {
        if (!isOpen || event.key !== 'Escape') return

        setIsRequested(false)
    }

    useEffect(() => {
        // Nothing to dismiss, so nothing to listen for.
        if (!isOpen) return

        function closeOnClickOutside(event: MouseEvent) {
            if (!rootRef.current?.contains(event.target as Node))
                setIsRequested(false)
        }

        // The listener is on the document rather than on a backdrop element: a
        // backdrop would swallow the click the user actually meant, so
        // dismissing the panel would cost them an extra click on whatever they
        // were aiming at.
        //
        // `mousedown` rather than `click` — the panel is positioned absolutely,
        // so closing it reflows nothing and the target cannot move out from
        // under the cursor between press and release.
        document.addEventListener('mousedown', closeOnClickOutside)

        return () => {
            document.removeEventListener('mousedown', closeOnClickOutside)
        }
    }, [isOpen])

    return (
        <div
            className="shared-search-bar"
            ref={rootRef}
            onKeyDown={closeOnEscape}
        >
            {/* A `<form>` rather than a `<div>`, so `type="submit"` on the
                button means something: pressing Enter in the field and clicking
                the button then arrive at the same handler, for free. */}
            <form
                className="fr-search-bar fr-search-bar--lg"
                role="search"
                onSubmit={(event) => {
                    // Nothing to post to — the search happens in the page.
                    event.preventDefault()
                    // Submitting is the user saying they are done choosing, so
                    // the suggestions have nothing left to offer.
                    setIsRequested(false)
                    onSearch?.(query)
                }}
            >
                {/* `fr-search-bar` hides its own label and keeps it as the
                    accessible name of the input, so this costs nothing on
                    screen — and without it the field has no name at all, a
                    placeholder being a hint rather than a name. */}
                <label className="fr-label" htmlFor={inputId}>
                    {label}
                </label>
                <input
                    className="fr-input"
                    placeholder={displayedPlaceholder}
                    id={inputId}
                    value={query}
                    // Editing the text is a fresh request for suggestions, so it
                    // reopens a panel the user had dismissed (Enter, the button,
                    // Escape, a click away). Without this, removing a letter can't
                    // re-open a list that a no-match query had emptied.
                    onChange={(event) => {
                        setQuery(event.target.value)
                        setIsRequested(true)
                    }}
                    // `type="search"` for the browser's own clear button, which
                    // DSFR styles; `role="combobox"` for what the field
                    // actually is once there is a list under it.
                    type="search"
                    role="combobox"
                    // What the field opens, and whether it is open — the pair a
                    // screen reader needs to announce a combobox. What is still
                    // missing is `aria-activedescendant` following the arrow
                    // keys, and picking an option.
                    aria-autocomplete="list"
                    aria-controls={panelId}
                    aria-expanded={isOpen}
                    // `focus` rather than `click`: it covers reaching the field
                    // with the keyboard too, and a click on an unfocused input
                    // focuses it anyway. Clicking a field that already has
                    // focus fires no `focus` event, hence the click handler as
                    // well — that is the case of reopening a panel the user
                    // just dismissed with Escape.
                    onFocus={() => setIsRequested(true)}
                    onClick={() => setIsRequested(true)}
                />
                <button title="Rechercher" type="submit" className="fr-btn">
                    Rechercher
                </button>
            </form>
            {isOpen && (
                // `aria-label` rather than pointing at the field's label: the
                // label names the field, and the list needs a name of its own
                // to be announced as anything more than "liste".
                <ul
                    className="fr-raw-list shared-search-bar__panel"
                    id={panelId}
                    role="listbox"
                    aria-label={label}
                >
                    {visibleOptions.map((option, index) => (
                        <li
                            key={index}
                            className="shared-search-bar__option"
                            role="option"
                            // Picking one fills the field and puts the list
                            // away — there is nothing left to choose from once
                            // the choice is made. Reaching an option with the
                            // arrow keys is still missing, so for now this is
                            // the mouse's way in only.
                            onClick={() => {
                                setQuery(option.label)
                                setIsRequested(false)
                                onSelect?.(option.value)
                            }}
                        >
                            {option.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
