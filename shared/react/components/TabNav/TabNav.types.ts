import type { ReactNode } from 'react'

export type TabNavItem = {
    // What the item is called in code rather than on screen: `currentId` is
    // matched against it and `onSelect` hands it back. Keeping the two apart
    // means a label that moves — a count, a wording change — never changes
    // which item is current.
    id: string
    label: ReactNode
    // Where the item leads. An item that has one is a real link: middle-click,
    // « ouvrir dans un nouvel onglet » and the browser's history all work
    // without anything being written here.
    //
    // Left out, the item is a `<button>` and `onSelect` is what moves the page.
    // That is the form a Grist widget needs: it is one page in one iframe, with
    // no URL of its own to point a link at.
    href?: string
}

export type TabNavProps = {
    // Names the navigation landmark. A page usually holds more than one — a
    // breadcrumb, a menu — and « navigation » on its own leaves a screen reader
    // user to guess which is which, so this is required.
    label: string
    items: readonly TabNavItem[]
    // The page being read. Showing it is a rule of the DSFR component rather
    // than one of its options — « Indiquer à l’usager la page active » — so it
    // is required, and an id matching no item leaves the navigation with
    // nothing marked, which is the bug it looks like.
    currentId: string
    // Called with the `id` of the item that was picked, including when that
    // item is already the current one — what a second click on the current page
    // means is the caller's to decide.
    //
    // Items carrying an `href` never reach it: the browser follows the link,
    // and that is the whole of what they do.
    onSelect?: (id: string) => void
}
