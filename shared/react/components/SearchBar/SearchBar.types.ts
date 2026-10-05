export type SearchBarProps = {
    // Names the field. `fr-search-bar` hides it visually and keeps it as the
    // accessible name of the input, so it is the only thing a screen reader has
    // to go on — a placeholder is not a name. Required for that reason, even
    // though nothing draws it.
    label: string
    // Shows the label above the field, as in a DSFR input group. Left out, the
    // label stays hidden, as `fr-search-bar` draws it.
    showLabel?: boolean
    // A line of help under the label, part of the field's accessible name.
    hint?: string
    // Texts to search for, offered under the field as the user types. Picking
    // one searches for it. Choosing a value from a list is the Combobox's job:
    // here a suggestion only saves typing. Empty (or absent) means no panel.
    suggestions?: readonly string[]
    placeholder?: string
    // Called with what has been typed, when the user submits — the button, or
    // Enter in the field. The component holds the draft text itself and only
    // hands it over on submit; what searching means is the caller's business.
    onSearch?: (query: string) => void
}
