export type SearchBarProps = {
    // Visually hidden by `fr-search-bar` unless `showLabel`, but always the
    // input's accessible name.
    label: string
    showLabel?: boolean
    hint?: string
    // Empty or absent means no suggestion panel.
    suggestions?: readonly string[]
    placeholder?: string
    // Called on submit only (button or Enter), with the typed text.
    onSearch?: (query: string) => void
}
