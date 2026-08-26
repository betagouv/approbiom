// DSFR's « onglets »: sections of content sharing one page, one of which is
// shown at a time. Unlike TabNav — which moves between pages and owns nothing —
// an onglet owns the panel under it, which is why the content is a prop here
// and the tablist/tabpanel roles are set.
//
// The stylesheet is DSFR's; the behaviour is ours. Their script is not loaded
// in a Grist widget, so what it does is done here instead: the roving tabindex,
// the arrow keys, and the panel that is hidden rather than merely invisible.
// Tabs.css says why that last one cannot be left to the stylesheet.
//
// https://www.systeme-de-design.gouv.fr/version-courante/fr/composants/onglet
import '@gouvfr/dsfr/dist/component/tab/tab.main.min.css'
import './Tabs.css'

import { useId, useRef, useState } from 'react'
import type { TabsProps } from './Tabs.types'

// The keys a tablist answers to, and where each one lands. Left and right wrap
// around, as they do in the DSFR script and in the ARIA pattern it follows.
const MOVES: Record<string, (index: number, count: number) => number> = {
    ArrowRight: (index, count) => (index + 1) % count,
    ArrowLeft: (index, count) => (index - 1 + count) % count,
    Home: () => 0,
    End: (_index, count) => count - 1,
}

export default function Tabs({ label, items, defaultId }: TabsProps) {
    // Ids only have to be unique in the document; `useId` keeps two sets of
    // onglets on the same page from pointing their tabs at each other's panels.
    const id = useId()
    const tabId = (itemId: string) => `${id}-${itemId}`
    const panelId = (itemId: string) => `${id}-${itemId}-panel`

    const [currentId, setCurrentId] = useState<string | undefined>(
        () => defaultId ?? items[0]?.id
    )

    // The arrow keys move focus as well as selection, so the tab being moved to
    // has to be reachable as a node. Keyed by id rather than held in an array:
    // a list that changes length would leave an index pointing at a tab that is
    // no longer there.
    const tabs = useRef(new Map<string, HTMLButtonElement>())

    function handleKeyDown(event: React.KeyboardEvent) {
        const move = MOVES[event.key]
        if (!move || items.length === 0) return

        // The list holds nothing focusable but the tabs, and the focused one is
        // always the selected one — that is what the roving tabindex below
        // means — so the current index is where the move starts from.
        const index = items.findIndex((item) => item.id === currentId)
        const next = items[move(index === -1 ? 0 : index, items.length)]

        // Otherwise the arrow keys scroll the page, and Home and End jump to
        // its ends, under the reader who was moving between tabs.
        event.preventDefault()

        // Selection follows focus, as in the DSFR script: a panel is one press
        // away rather than a press and an Enter.
        setCurrentId(next.id)
        tabs.current.get(next.id)?.focus()
    }

    return (
        <div className="fr-tabs shared-tabs">
            {/* The keys are caught on the list rather than on each tab: they
                are the tablist's own behaviour, and a tab that is being moved
                away from should not have to know where the next one is. */}
            <ul
                className="fr-tabs__list"
                role="tablist"
                aria-label={label}
                onKeyDown={handleKeyDown}
            >
                {items.map((item) => {
                    const selected = item.id === currentId

                    return (
                        // `role="presentation"` drops the list semantics the
                        // `<li>` would otherwise add inside a tablist, whose
                        // children are tabs and nothing else.
                        <li key={item.id} role="presentation">
                            <button
                                type="button"
                                id={tabId(item.id)}
                                className="fr-tabs__tab"
                                role="tab"
                                aria-selected={selected}
                                aria-controls={panelId(item.id)}
                                // A roving tabindex: one Tab press enters the
                                // tablist and the next leaves it, instead of
                                // stopping on every tab on the way to the
                                // panel. The arrow keys move inside it.
                                tabIndex={selected ? 0 : -1}
                                ref={(node) => {
                                    const nodes = tabs.current
                                    if (node) nodes.set(item.id, node)
                                    return () => {
                                        nodes.delete(item.id)
                                    }
                                }}
                                onClick={() => setCurrentId(item.id)}
                            >
                                {item.label}
                            </button>
                        </li>
                    )
                })}
            </ul>

            {items.map((item) => {
                const selected = item.id === currentId

                return (
                    // Every panel stays mounted, `hidden` being what closes the
                    // ones that are not being read: `aria-controls` above then
                    // always resolves to something, and a table keeps how it
                    // was sorted while its neighbour is looked at.
                    <div
                        key={item.id}
                        id={panelId(item.id)}
                        className={
                            selected
                                ? 'fr-tabs__panel fr-tabs__panel--selected'
                                : 'fr-tabs__panel'
                        }
                        role="tabpanel"
                        aria-labelledby={tabId(item.id)}
                        // The panel is what the arrow keys lead to, so it takes
                        // focus itself — its content may hold nothing that
                        // does, and a reader would then have nowhere to land.
                        tabIndex={0}
                        hidden={!selected}
                    >
                        {item.content}
                    </div>
                )
            })}
        </div>
    )
}
