export type MultiSelectOption<T> = {
    // Matched by identity (`Set`): must be unique across the whole list.
    value: T
    label: string
    // Not toggleable, even by its group's checkbox or "Tout sélectionner".
    // Stays selected if it already was.
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
    label: string
    description?: string
    options: readonly MultiSelectItem<T>[]
    selectedValues: readonly T[]
    // Always called with the values in list order, whatever order they were
    // clicked in.
    onSelectionChange: (values: T[]) => void
    // Accessible name of the checkbox group; falls back to `label`.
    legend?: string
    // Only has an effect together with `legend`.
    hideLegend?: boolean
    showSelectAll?: boolean
    searchable?: boolean
}
