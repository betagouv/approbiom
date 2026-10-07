import type { ReactNode } from 'react'

export type SelectableTagProps = {
    // Short: DSFR wants a tag to be read at a glance.
    children: ReactNode
    // Controlled: the tag shows what it is given.
    pressed: boolean
    onToggle: () => void
    // Help the label leaves out, shown on hover.
    title?: string
    // DSFR ships two sizes and `md` is the one it falls back to.
    size?: 'sm' | 'md'
}
