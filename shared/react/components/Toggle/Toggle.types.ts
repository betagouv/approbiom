export type ToggleProps = {
    // Visible text of the switch, and its accessible name. Required: a switch
    // with nothing next to it says only that something is on, not what.
    label: string
    // Hint shown under the switch. Pointed at with `aria-describedby` rather
    // than folded into the label, which is how DSFR writes it: the state is the
    // name, the hint is a comment on it.
    description?: string
    // State is controlled by the parent: the component renders what it is given
    // and reports back what the user asked for, it never holds a state of its
    // own.
    checked: boolean
    onChange: (checked: boolean) => void
    disabled?: boolean
    // Puts the label first and pushes the switch to the right edge, which is
    // DSFR's `fr-toggle--label-left`. Off by default, like DSFR's own default.
    labelLeft?: boolean
    // Draws « Activé » / « Désactivé » beside the switch. DSFR only paints that
    // text when both of its data attributes are set, so this is what turns them
    // on — and leaving it off is what gives the bare switch of the model.
    showState?: boolean
}
