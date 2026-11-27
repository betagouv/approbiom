import '@gouvfr/dsfr/dist/component/form/form.main.min.css'
import '@gouvfr/dsfr/dist/component/input/input.main.min.css'
import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/component/search/search.main.min.css'

import './SearchBar.css'
import type { SearchBarProps } from './SearchBar.types'
import { useEffect, useId, useRef, useState } from 'react'
import { normalizeSearchText as normalize } from '@shared/react/search-text'

export default function SearchBar({
    label,
    hint,
    showLabel = false,
    suggestions = [],
    placeholder,
    onSearch,
}: SearchBarProps) {
    const id = useId()
    const inputId = `${id}-search-input`
    const panelId = `${id}-search-panel`
    const displayedPlaceholder = placeholder ?? 'Rechercher'

    const labelElement = (
        <label
            className={
                showLabel ? 'fr-label shared-search-bar__label' : 'fr-label'
            }
            htmlFor={inputId}
        >
            {label}
            {hint !== undefined && <span className="fr-hint-text">{hint}</span>}
        </label>
    )

    const [isRequested, setIsRequested] = useState(false)
    const [query, setQuery] = useState('')

    const rootRef = useRef<HTMLDivElement>(null)

    const visibleSuggestions = suggestions.filter((suggestion) =>
        normalize(suggestion).includes(normalize(query.trim()))
    )

    const isOpen = isRequested && visibleSuggestions.length > 0

    function closeOnEscape(event: React.KeyboardEvent) {
        if (!isOpen || event.key !== 'Escape') return

        setIsRequested(false)
    }

    useEffect(() => {
        if (!isOpen) return

        function closeOnClickOutside(event: MouseEvent) {
            if (!rootRef.current?.contains(event.target as Node))
                setIsRequested(false)
        }

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
            {/* Outside the form: `fr-search-bar` hides any label inside it. */}
            {showLabel && labelElement}
            <form
                className="fr-search-bar"
                role="search"
                onSubmit={(event) => {
                    event.preventDefault()
                    setIsRequested(false)
                    onSearch?.(query)
                }}
            >
                {!showLabel && labelElement}
                <input
                    className="fr-input"
                    placeholder={displayedPlaceholder}
                    id={inputId}
                    value={query}
                    // Reopens a dismissed panel, e.g. after a no-match query
                    // emptied it.
                    onChange={(event) => {
                        setQuery(event.target.value)
                        setIsRequested(true)
                    }}
                    type="search"
                    {...(suggestions.length > 0 && {
                        role: 'combobox',
                        'aria-autocomplete': 'list',
                        'aria-controls': panelId,
                        'aria-expanded': isOpen,
                    })}
                    // Clicking an already focused field fires no `focus` (e.g.
                    // after Escape).
                    onFocus={() => setIsRequested(true)}
                    onClick={() => setIsRequested(true)}
                />
                <button title="Rechercher" type="submit" className="fr-btn">
                    Rechercher
                </button>
            </form>
            {isOpen && (
                <ul
                    className="fr-raw-list shared-search-bar__panel"
                    id={panelId}
                    role="listbox"
                    aria-label={label}
                >
                    {visibleSuggestions.map((suggestion, index) => (
                        <li
                            key={index}
                            className="shared-search-bar__option"
                            role="option"
                            onClick={() => {
                                setQuery(suggestion)
                                setIsRequested(false)
                                onSearch?.(suggestion)
                            }}
                        >
                            {suggestion}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
