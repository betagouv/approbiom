import type { ReactNode } from 'react'

export type TabItem = {
    // What the tab is called in code rather than on screen: it is what
    // `defaultId` is matched against, and what the ids tying a tab to its panel
    // are built from. Keeping it apart from the label means a wording change
    // never changes which tab is which.
    //
    // It ends up inside an `id` attribute, so a slug — no spaces.
    id: string
    label: ReactNode
    // What the tab shows. Unlike a navigation, an onglet owns its panel: the
    // content is handed over here rather than rendered by the caller under the
    // list, so the component can tie the two together and hide the ones that
    // are not being read.
    content: ReactNode
}

export type TabsProps = {
    // Names the tablist. A page may hold more than one set of onglets, and
    // « liste d'onglets » on its own leaves a screen reader user to guess which
    // is which, so this is required.
    label: string
    items: readonly TabItem[]
    // Which tab is open on first render. Left out, it is the first item — the
    // DSFR component always has one tab selected, so there is no such thing as
    // opening with all panels closed.
    //
    // Only read on the first render: which tab is open afterwards is the
    // component's own business, the way it is in the DSFR script.
    defaultId?: string
}
