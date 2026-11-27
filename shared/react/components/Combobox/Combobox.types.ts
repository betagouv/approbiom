import type { Ref } from 'react'

export type ComboboxOption<T> = {
    // Matched by identity against `value`, like `SelectOption`.
    value: T
    label: string
}

export type ComboboxMessage = {
    severity: 'error' | 'valid'
    text: string
}

// A last line under the options, e.g. « Ajouter un fournisseur ». Both
// functions get the typed text, trimmed.
export type ComboboxAction = {
    label: (query: string) => string
    onActivate: (query: string) => void
    // Leaves the line out, for a query that already names an option.
    hidden?: (query: string) => boolean
}

export type ComboboxHandle = {
    focus: () => void
}

export type ComboboxProps<T> = {
    label: string
    hint?: string
    options: readonly ComboboxOption<T>[]
    // `null` while nothing is chosen.
    value: T | null
    // Called with the chosen option's value, and with `null` when the choice is
    // undone: typing over it, or clearing the field.
    onChange: (value: T | null) => void
    placeholder?: string
    action?: ComboboxAction
    // The component's own message, for a text left without choosing, takes precedence.
    message?: ComboboxMessage
    ref?: Ref<ComboboxHandle>
}
