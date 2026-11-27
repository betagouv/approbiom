// DSFR 1.14.4 ships no « liste déroulante riche »: composed from its primitives.
import '@gouvfr/dsfr/dist/component/form/form.main.min.css'
import '@gouvfr/dsfr/dist/component/select/select.main.min.css'
import '@gouvfr/dsfr/dist/component/checkbox/checkbox.main.min.css'
import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/component/input/input.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.main.min.css'

import './MultiSelect.css'
import { useEffect, useId, useRef, useState } from 'react'
import { normalizeSearchText } from '@shared/react/search-text'
import { plural } from '@shared/react/format'
import type {
    MultiSelectGroup,
    MultiSelectItem,
    MultiSelectOption,
    MultiSelectProps,
} from './MultiSelect.types'

function isGroup<T>(item: MultiSelectItem<T>): item is MultiSelectGroup<T> {
    return 'options' in item
}

function searchItems<T>(
    items: readonly MultiSelectItem<T>[],
    query: string
): MultiSelectItem<T>[] {
    const needle = normalizeSearchText(query.trim())
    if (needle === '') return [...items]

    const matches = (label: string) =>
        normalizeSearchText(label).includes(needle)

    return items.flatMap((item): MultiSelectItem<T>[] => {
        if (!isGroup(item)) return matches(item.label) ? [item] : []
        if (matches(item.label)) return [item]

        const options = item.options.filter((option) => matches(option.label))
        return options.length === 0 ? [] : [{ ...item, options }]
    })
}

export default function MultiSelect<T>({
    label,
    description,
    options,
    selectedValues,
    onSelectionChange,
    legend,
    hideLegend = false,
    showSelectAll = false,
    searchable = false,
}: MultiSelectProps<T>) {
    const id = useId()
    const labelId = `${id}-label`
    const triggerId = `${id}-trigger`
    const panelId = `${id}-panel`
    const descriptionId = `${id}-description`
    const searchId = `${id}-search`

    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')

    // Contains the control too, so clicking it is left to its own toggle.
    const rootRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const searchRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isOpen && searchable) searchRef.current?.focus()
    }, [isOpen, searchable])

    function toggleOpen() {
        if (!isOpen) setQuery('')
        setIsOpen(!isOpen)
    }

    function closeOnEscape(event: React.KeyboardEvent) {
        if (!isOpen || event.key !== 'Escape') return

        setIsOpen(false)
        // Focus is inside the panel about to be hidden.
        triggerRef.current?.focus()
    }

    useEffect(() => {
        if (!isOpen) return

        function closeOnClickOutside(event: MouseEvent) {
            if (!rootRef.current?.contains(event.target as Node))
                setIsOpen(false)
        }

        document.addEventListener('mousedown', closeOnClickOutside)

        return () => {
            document.removeEventListener('mousedown', closeOnClickOutside)
        }
    }, [isOpen])

    const selected = new Set(selectedValues)

    const allOptions = options.flatMap((item) =>
        isGroup(item) ? item.options : [item]
    )

    // `allOptions` stays the whole list: the selection is read and ordered from it.
    const shownItems = searchable ? searchItems(options, query) : options
    const shownOptions = shownItems.flatMap((item) =>
        isGroup(item) ? item.options : [item]
    )

    // Empty until something is searched.
    const searchStatus =
        query.trim() === ''
            ? ''
            : shownOptions.length === 0
              ? 'Aucun résultat'
              : plural(shownOptions.length, 'résultat')

    function selectableIn(candidates: readonly MultiSelectOption<T>[]) {
        return candidates.filter((option) => !option.disabled)
    }

    function isAllSelected(candidates: readonly MultiSelectOption<T>[]) {
        const selectable = selectableIn(candidates)

        return (
            selectable.length > 0 &&
            selectable.every((option) => selected.has(option.value))
        )
    }

    function reportSelection(next: Set<T>) {
        // Rebuilt from the list so the selection comes back in list order.
        onSelectionChange(
            allOptions
                .filter((option) => next.has(option.value))
                .map((option) => option.value)
        )
    }

    function toggleOption(value: T, checked: boolean) {
        const next = new Set(selected)
        if (checked) next.add(value)
        else next.delete(value)

        reportSelection(next)
    }

    function toggleAll(
        candidates: readonly MultiSelectOption<T>[],
        checked: boolean
    ) {
        const next = new Set(selected)
        for (const option of selectableIn(candidates)) {
            if (checked) next.add(option.value)
            else next.delete(option.value)
        }

        reportSelection(next)
    }

    // Off the list, so a stale value for an option no longer offered is not announced.
    const selectedLabels = allOptions
        .filter((option) => selected.has(option.value))
        .map((option) => option.label)

    const summary =
        selectedLabels.length === 0
            ? 'Sélectionner une option'
            : selectedLabels.join(', ')

    function renderOption(option: MultiSelectOption<T>, key: string) {
        const optionId = `${id}-${key}`

        return (
            <div key={key} className="fr-checkbox-group fr-checkbox-group--sm">
                <input
                    type="checkbox"
                    id={optionId}
                    checked={selected.has(option.value)}
                    disabled={option.disabled}
                    onChange={(event) =>
                        toggleOption(option.value, event.target.checked)
                    }
                />
                <label className="fr-label" htmlFor={optionId}>
                    {option.label}
                </label>
            </div>
        )
    }

    function renderGroup(group: MultiSelectGroup<T>) {
        const groupId = `${id}-${group.id}`
        // Ids come from the place in the whole group, so they survive a search.
        const wholeGroup =
            options.find(
                (item): item is MultiSelectGroup<T> =>
                    isGroup(item) && item.id === group.id
            ) ?? group
        const allSelected = isAllSelected(group.options)
        const someSelected = group.options.some((option) =>
            selected.has(option.value)
        )

        // The group checkbox has no value: `selectedValues` only holds option values.
        return (
            <div key={group.id} className="shared-multi-select__group">
                <div className="fr-checkbox-group fr-checkbox-group--sm">
                    <input
                        type="checkbox"
                        id={groupId}
                        checked={allSelected}
                        disabled={selectableIn(group.options).length === 0}
                        // `indeterminate` has no HTML attribute.
                        ref={(input) => {
                            if (input)
                                input.indeterminate =
                                    someSelected && !allSelected
                        }}
                        onChange={(event) =>
                            toggleAll(group.options, event.target.checked)
                        }
                    />
                    <label className="fr-label" htmlFor={groupId}>
                        {group.label}
                        {group.description && (
                            <span className="fr-hint-text">
                                {group.description}
                            </span>
                        )}
                    </label>
                </div>
                <div className="shared-multi-select__group-options">
                    {group.options.map((option) =>
                        renderOption(
                            option,
                            `${group.id}-${wholeGroup.options.indexOf(option)}`
                        )
                    )}
                </div>
            </div>
        )
    }

    const allSelected = isAllSelected(shownOptions)

    return (
        <div
            className="fr-select-group shared-multi-select"
            ref={rootRef}
            onKeyDown={closeOnEscape}
        >
            {/* `aria-labelledby`: the button's own content (the selection)
                would otherwise name it. */}
            <label className="fr-label" htmlFor={triggerId}>
                <span id={labelId}>{label}</span>
                {description && (
                    <span className="fr-hint-text" id={descriptionId}>
                        {description}
                    </span>
                )}
            </label>
            <button
                type="button"
                id={triggerId}
                ref={triggerRef}
                className="fr-select shared-multi-select__trigger"
                aria-labelledby={`${labelId} ${triggerId}`}
                aria-describedby={description ? descriptionId : undefined}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={toggleOpen}
            >
                {summary}
            </button>
            {/* `hidden` rather than unmounting, so `aria-controls` resolves. */}
            <div
                className="shared-multi-select__panel"
                id={panelId}
                hidden={!isOpen}
            >
                {searchable && (
                    <>
                        <label
                            className="fr-label fr-sr-only"
                            htmlFor={searchId}
                        >
                            Rechercher dans {label}
                        </label>
                        <input
                            ref={searchRef}
                            id={searchId}
                            type="search"
                            className="fr-input shared-multi-select__search"
                            placeholder="Rechercher"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                        />
                    </>
                )}
                {showSelectAll && (
                    <button
                        type="button"
                        className={`fr-btn fr-btn--tertiary fr-btn--icon-left shared-multi-select__select-all ${
                            allSelected
                                ? 'fr-icon-close-circle-line'
                                : 'fr-icon-checkbox-circle-line'
                        }`}
                        disabled={selectableIn(shownOptions).length === 0}
                        onClick={() => toggleAll(shownOptions, !allSelected)}
                    >
                        {allSelected
                            ? 'Tout désélectionner'
                            : 'Tout sélectionner'}
                    </button>
                )}
                <fieldset
                    className="fr-fieldset"
                    aria-label={legend ? undefined : label}
                >
                    {legend && (
                        <legend
                            className={`fr-fieldset__legend ${
                                hideLegend ? 'fr-sr-only' : ''
                            }`}
                        >
                            {legend}
                        </legend>
                    )}
                    <div className="fr-fieldset__element shared-multi-select__options">
                        {shownItems.map((item) =>
                            isGroup(item)
                                ? renderGroup(item)
                                : renderOption(
                                      item,
                                      `option-${options.indexOf(item)}`
                                  )
                        )}
                        {/* Mounted with the field, so screen readers already
                            watch it when it changes. */}
                        {searchable && (
                            <p
                                role="status"
                                className={
                                    shownItems.length === 0
                                        ? 'shared-multi-select__no-result'
                                        : 'fr-sr-only'
                                }
                            >
                                {searchStatus}
                            </p>
                        )}
                    </div>
                </fieldset>
            </div>
        </div>
    )
}
