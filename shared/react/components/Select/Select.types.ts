export type SelectOption<T> = {
    // What the caller gets back when the option is picked. Values are matched
    // by identity, so objects are handed back as the very ones passed in
    // `options`. They have to be unique across the whole list: two options
    // sharing a value would both draw as selected.
    value: T
    // Visible text of the option, and its accessible name.
    label: string
    // Rendered, but not pickable. An option that is disabled while selected
    // stays selected — the component is controlled, so nothing here clears it.
    disabled?: boolean
}

export type SelectGroup<T> = {
    id: string
    label: string
    // Read-only, like `SelectProps['options']`, and for the same reason.
    options: readonly SelectOption<T>[]
    // Disables the whole group in one go. `<optgroup disabled>` disables every
    // option it holds natively, so this needs no help from the component.
    disabled?: boolean
    // No `description`, unlike `MultiSelectGroup`: a group here is an
    // `<optgroup>`, and the browser draws it from its `label` alone — there is
    // nowhere to put a hint. A group that needs one is a sign the libellé or
    // the `description` of the whole list should be carrying it.
}

export type SelectItem<T> = SelectOption<T> | SelectGroup<T>

export type SelectMessage = {
    // The two states DSFR documents for a liste déroulante. They are spelled
    // the way DSFR spells them, so each one is the class it turns into:
    // `fr-select-group--error` / `fr-select-group--valid` on the wrapper, and
    // `fr-message--error` / `fr-message--valid` on the text.
    severity: 'error' | 'valid'
    text: string
}

export type SelectProps<T> = {
    // Names the list. Required: DSFR gives a liste déroulante no placeholder
    // text of its own, so without this nothing on screen says what is being
    // chosen.
    label: string
    // Hint shown under the libellé, inside it. Read out with the libellé rather
    // than after it, so it becomes part of the accessible name. Optional.
    description?: string
    // Read-only array: the component only iterates over it, and accepting
    // `readonly` lets callers pass frozen or `as const` data without a cast.
    // The same shape MultiSelect takes, so one list of options can drive
    // either component.
    options: readonly SelectItem<T>[]
    // Selection is controlled by the parent: the component renders what it is
    // given and reports back what the user asked for, it never holds a
    // selection of its own. `null` is nothing picked yet, which is the state
    // the list starts in when it has no default — and the only way back to it,
    // since the placeholder is not pickable: the user can change their choice,
    // not undo it.
    value: T | null
    // Only ever called with a value taken from `options`, so the caller gets
    // back the very value it passed in rather than a copy of it.
    onChange: (value: T) => void
    // The first line of the list, shown while nothing is picked. It is not
    // pickable — see `value` above. Defaults to DSFR's own wording.
    placeholder?: string
    // Disables the whole list. Options keep their own `disabled` underneath,
    // which only matters once the list is enabled again.
    disabled?: boolean
    // The error or success text shown under the list. Left out for a list with
    // nothing to say, which is the usual state.
    message?: SelectMessage
}
