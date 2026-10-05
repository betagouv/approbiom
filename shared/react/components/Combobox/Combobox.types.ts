import type { Ref } from 'react'

export type ComboboxOption<T> = {
    // Matched by identity against `value`, like `SelectOption`.
    value: T
    // Visible text of the option, what the search runs on, and what the field
    // shows once the option is chosen.
    label: string
}

export type ComboboxMessage = {
    severity: 'error' | 'valid'
    text: string
}

// A last line under the options, for what the list does not hold yet — « Ajouter
// un fournisseur ». Both functions get what is typed, trimmed.
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
    // Help under the label, part of the field's accessible name.
    hint?: string
    // In the order they are listed.
    options: readonly ComboboxOption<T>[]
    // Controlled, like `Select`: `null` while nothing is chosen.
    value: T | null
    // Called with the chosen option's value, and with `null` when the choice is
    // undone: typing over it, or clearing the field.
    onChange: (value: T | null) => void
    placeholder?: string
    action?: ComboboxAction
    // Shown under the field. The component's own message, for a text left in
    // the field without choosing, comes first.
    message?: ComboboxMessage
    // To put the focus back in the field from outside.
    ref?: Ref<ComboboxHandle>
}
