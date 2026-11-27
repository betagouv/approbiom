// DSFR's « onglets ». The DSFR script is not loaded in a Grist widget, so its
// behaviour is reimplemented here.
// https://www.systeme-de-design.gouv.fr/version-courante/fr/composants/onglet
import '@gouvfr/dsfr/dist/component/tab/tab.main.min.css'
import './Tabs.css'

import { useId, useRef, useState } from 'react'
import type { TabsProps } from './Tabs.types'

const MOVES: Record<string, (index: number, count: number) => number> = {
    ArrowRight: (index, count) => (index + 1) % count,
    ArrowLeft: (index, count) => (index - 1 + count) % count,
    Home: () => 0,
    End: (_index, count) => count - 1,
}

export default function Tabs({
    label,
    items,
    defaultId,
    currentId: controlledId,
    onSelect,
}: TabsProps) {
    const id = useId()
    const tabId = (itemId: string) => `${id}-${itemId}`
    const panelId = (itemId: string) => `${id}-${itemId}-panel`

    const [ownId, setOwnId] = useState<string | undefined>(
        () => defaultId ?? items[0]?.id
    )
    const currentId = controlledId ?? ownId

    function open(id: string) {
        setOwnId(id)
        onSelect?.(id)
    }

    // Keyed by id: indexes would go stale when the list changes length.
    const tabs = useRef(new Map<string, HTMLButtonElement>())

    function handleKeyDown(event: React.KeyboardEvent) {
        const move = MOVES[event.key]
        if (!move || items.length === 0) return

        const index = items.findIndex((item) => item.id === currentId)

        // Skip disabled tabs in the direction of the move; from Home/End,
        // inwards.
        let nextIndex = move(index === -1 ? 0 : index, items.length)
        const step = event.key === 'ArrowLeft' || event.key === 'End' ? -1 : 1
        for (let tries = 0; items[nextIndex].disabled; tries++) {
            if (tries === items.length) return
            nextIndex = (nextIndex + step + items.length) % items.length
        }
        const next = items[nextIndex]

        event.preventDefault()

        open(next.id)
        tabs.current.get(next.id)?.focus()
    }

    return (
        <div className="fr-tabs shared-tabs">
            <ul
                className="fr-tabs__list"
                role="tablist"
                aria-label={label}
                onKeyDown={handleKeyDown}
            >
                {items.map((item) => {
                    const selected = item.id === currentId

                    return (
                        <li key={item.id} role="presentation">
                            <button
                                type="button"
                                id={tabId(item.id)}
                                className="fr-tabs__tab"
                                role="tab"
                                aria-selected={selected}
                                aria-controls={panelId(item.id)}
                                tabIndex={
                                    item.disabled ? -1 : selected ? 0 : -1
                                }
                                disabled={item.disabled}
                                aria-disabled={item.disabled}
                                ref={(node) => {
                                    const nodes = tabs.current
                                    if (node) nodes.set(item.id, node)
                                    return () => {
                                        nodes.delete(item.id)
                                    }
                                }}
                                onClick={() => open(item.id)}
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
                    // All panels stay mounted so `aria-controls` resolves and
                    // panel state (e.g. sorting) survives.
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
                        // Its content may hold nothing focusable.
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
