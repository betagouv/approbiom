export type SearchBarOption<T> = {
    value: T
    label: string
}

export type SearchBarProps<T> = {
    // Names the field. `fr-search-bar` hides it visually and keeps it as the
    // accessible name of the input, so it is the only thing a screen reader has
    // to go on — a placeholder is not a name. Required for that reason, even
    // though nothing draws it.
    label: string
    // Read-only array: the component only iterates over it, and accepting
    // `readonly` lets callers pass frozen or `as const` data without a cast.
    // Empty (or absent) means no panel at all.
    options?: readonly SearchBarOption<T>[]
    placeholder?: string
    // Called with what has been typed, when the user submits — the button, or
    // Enter in the field. The component holds the draft text itself and only
    // hands it over on submit; what searching means is the caller's business.
    onSearch?: (query: string) => void
    // Called when a suggestion is picked, with that option's `value` — the
    // reason options carry one at all. The field takes the option's label at
    // the same time, so the caller does not have to put it there.
    onSelect?: (value: T) => void
}
