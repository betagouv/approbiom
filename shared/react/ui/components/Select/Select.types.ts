export type SelectOption<T> = {
    // Matched by identity: must be unique across the whole list.
    value: T
    label: string
    // An option disabled while selected stays selected.
    disabled?: boolean
}

export type SelectGroup<T> = {
    id: string
    label: string
    options: readonly SelectOption<T>[]
    disabled?: boolean
}

export type SelectItem<T> = SelectOption<T> | SelectGroup<T>

export type SelectMessage = {
    // Spelled as DSFR's modifier classes (`fr-select-group--error`,
    // `fr-message--valid`…).
    severity: 'error' | 'valid'
    text: string
}

export type SelectProps<T> = {
    label: string
    description?: string
    options: readonly SelectItem<T>[]
    // `null` is nothing picked yet; the placeholder is not pickable, so the
    // user cannot get back to it.
    value: T | null
    // Called with the very value from `options`, not a copy.
    onChange: (value: T) => void
    // Defaults to DSFR's own wording.
    placeholder?: string
    disabled?: boolean
    message?: SelectMessage
}
