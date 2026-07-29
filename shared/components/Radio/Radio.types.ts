export type RadioSize = 'sm' | 'md'

export type RadioProps = {
    // What ties the radios of one group together. The browser reads it to work
    // out which controls are alternatives to one another, and that is what
    // makes the arrow keys walk between them and what makes picking one clear
    // the others. Two groups sharing a name on the same page become one group.
    name: string
    // Visible text of the radio, and the start of its accessible name.
    label: string
    // Hint shown under the label, inside it. Read out with the label rather
    // than after it, so it becomes part of the accessible name.
    description?: string
    // What a native form submission would carry for this radio. Optional
    // because a group driven from React reports its selection through
    // `onChange` and never goes near the submitted data — see RadioGroup.
    value?: string
    // Selection is controlled by the parent: the component renders what it is
    // given, it never holds a selection of its own.
    checked: boolean
    disabled?: boolean
    size?: RadioSize
    // Called when this radio becomes the selected one. It takes no argument
    // because there is nothing to report: a radio only ever fires this on its
    // way to checked — the one it deselects is told nothing by the browser,
    // which is why the group above has to hold the selection.
    onChange: () => void
}

export type RadioOption<T> = {
    // What the caller gets back when the option is picked. Values are matched
    // by identity, so objects are handed back as the very ones passed in
    // `options`. They have to be unique across the list: two options sharing a
    // value would both draw as selected.
    value: T
    // Visible text of the option, and the start of its accessible name.
    label: string
    // Hint shown under the option's label.
    description?: string
    // Rendered, but not selectable. An option that is disabled while selected
    // stays selected — the group is controlled, so nothing here clears it.
    disabled?: boolean
}

export type RadioGroupMessage = {
    // The two states DSFR documents for a group of radios. They are spelled the
    // way DSFR spells them, so each one is the class it turns into:
    // `fr-fieldset--error` / `fr-fieldset--valid` on the group, and
    // `fr-message--error` / `fr-message--valid` on the text.
    severity: 'error' | 'valid'
    text: string
}

export type RadioGroupProps<T> = {
    // Names the group. Required: a lone radio means nothing, so what the user
    // is choosing between can only be said here. It is visually the label of
    // the group, which is why it is drawn in a regular weight rather than the
    // bold a `<legend>` would take by default.
    legend: string
    // Hint shown under the legend, inside it. Optional.
    description?: string
    // Read-only array: the component only iterates over it, and accepting
    // `readonly` lets callers pass frozen or `as const` data without a cast.
    options: readonly RadioOption<T>[]
    // Selection is controlled by the parent. `null` is nothing selected yet,
    // which is the state a group starts in when it has no default — and the
    // only way back to it, since the user cannot undo a choice, only change it.
    value: T | null
    onChange: (value: T) => void
    // Shared by every radio in the group. Optional: without it the group makes
    // one up, which is right everywhere except a real `<form>` submission,
    // where the name is the key the value arrives under.
    name?: string
    size?: RadioSize
    // Lays the options out in a row rather than stacked. For short labels and
    // few options — a long label wraps badly next to its neighbours.
    inline?: boolean
    // Disables the whole group in one go, options included. Their own
    // `disabled` still applies on top, so a group that is enabled can still
    // hold options that are not.
    disabled?: boolean
    // The error or success text shown under the options. Left out for a group
    // with nothing to say, which is the usual state.
    message?: RadioGroupMessage
}
