export type ToggleProps = {
    label: string
    description?: string
    checked: boolean
    onChange: (checked: boolean) => void
    disabled?: boolean
    // DSFR's `fr-toggle--label-left`.
    labelLeft?: boolean
    // Draws « Activé » / « Désactivé » beside the switch.
    showState?: boolean
}
