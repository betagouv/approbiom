export type CopyButtonProps = {
    // What lands in the clipboard.
    value: string
    // What is copied, as the end of « Copier … » for screen readers, such as
    // « la dénomination ». Without it the button only says « Copier ».
    label?: string
}
