import type { ReactNode } from 'react'

export type DismissibleTagProps = {
    children: ReactNode
    dismissLabel: string
    onDismiss: () => void
    size?: 'sm' | 'md'
}
