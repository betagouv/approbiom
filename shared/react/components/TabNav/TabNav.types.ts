import type { ReactNode } from 'react'

export type TabNavItem = {
    id: string
    label: ReactNode
    // Left out, the item is a `<button>` driven by `onSelect` (a Grist widget
    // has no URL to link to).
    href?: string
}

export type TabNavProps = {
    label: string
    items: readonly TabNavItem[]
    // An id matching no item leaves nothing marked as current.
    currentId: string
    // Also called when the current item is clicked again. Never called for
    // items with an `href`.
    onSelect?: (id: string) => void
}
