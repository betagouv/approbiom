import type { ReactNode } from 'react'

export type TabItem = {
    // Used inside `id` attributes: a slug, no spaces.
    id: string
    label: ReactNode
    content: ReactNode
    // Stays in the list, greyed out, and skipped by the arrow keys.
    disabled?: boolean
}

export type TabsProps = {
    label: string
    items: readonly TabItem[]
    // Defaults to the first item. Only read on first render.
    defaultId?: string
    // Makes the component controlled: it follows this and reports changes
    // through `onSelect`.
    currentId?: string
    onSelect?: (id: string) => void
}
