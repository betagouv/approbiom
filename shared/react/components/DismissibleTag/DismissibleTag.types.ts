import type { ReactNode } from 'react'

export type DismissibleTagProps = {
    // The filter it recalls, kept short.
    children: ReactNode
    // The button's accessible name: what the click does, not just the label —
    // « Retirer le filtre 1A-PFA ».
    dismissLabel: string
    onDismiss: () => void
    // DSFR ships two sizes and `md` is the one it falls back to.
    size?: 'sm' | 'md'
}
