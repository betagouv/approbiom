import type { ReactNode } from 'react'

export type SelectableTagProps = {
    children: ReactNode
    pressed: boolean
    onToggle: () => void
    title?: string
    size?: 'sm' | 'md'
}
