export type MultiSelectOption<T> = {
    // What the caller gets back when the option is checked. Values are matched
    // by identity (`Set`), so objects are handed back as the very ones passed
    // in `options`. They have to be unique across the whole list: two options
    // sharing a value would check and uncheck together.
    value: T
    // Visible text of the checkbox, and its accessible name.
    label: string
    // Rendered, but not toggleable — neither by the user, nor by its group's
    // checkbox, nor by "Tout sélectionner". A disabled option that is already
    // selected stays selected.
    disabled?: boolean
}

export type MultiSelectGroup<T> = {
    id: string
    label: string
    description?: string
    options: readonly MultiSelectOption<T>[]
}

export type MultiSelectItem<T> = MultiSelectOption<T> | MultiSelectGroup<T>

export type MultiSelectProps<T> = {
    // Names the control that opens the list. Required: it is the only thing on
    // screen when the list is collapsed.
    label: string
    // Hint shown under the control, and read out with it. Optional.
    description?: string
    // Read-only array: the component only iterates over it, and accepting
    // `readonly` lets callers pass frozen or `as const` data without a cast.
    options: readonly MultiSelectItem<T>[]
    // Selection is controlled by the parent: the component renders what it is
    // given and reports back what the user asked for, it never holds a
    // selection of its own. Only options carry values — a group's checkbox is
    // derived from its own options, so it never appears here.
    selectedValues: readonly T[]
    // Always called with the values in list order, whatever order they were
    // clicked in.
    onSelectionChange: (values: T[]) => void
    // Names the group of checkboxes. Optional: without it the group falls back
    // to `label` as its accessible name, which is right when the label already
    // says what is being chosen.
    legend?: string
    // Keeps the legend as the accessible name of the group without drawing it
    // — the case where `label` already says it on screen and repeating it would
    // only be noise. Only has an effect together with `legend`.
    hideLegend?: boolean
    // Shows the "Tout sélectionner" / "Tout désélectionner" button. Off by
    // default: it is dead weight on a short list.
    showSelectAll?: boolean
}
