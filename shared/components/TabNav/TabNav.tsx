// DSFR's « navigation tertiaire »: the third level of navigation, under a
// section title, linking the pages of one section to each other.
//
// Unlike every other component in this folder, it is not backed by a DSFR
// stylesheet — there is none to import. The component is published in beta, as
// a design only, and its documentation says so in as many words: « Ce composant
// est en version bêta. Il n'existe pas en code ». So the markup and the styles
// are ours, drawn from the published anatomy — a row of links, a separator
// under them, an underline marking the page being read. TabNav.css is where
// that is done, against DSFR's own tokens.
//
// It is a navigation, not the `tab` component, which the DSFR is careful to
// separate: onglets shape content inside one page and own the panels below
// them, while this moves between pages and owns nothing. Hence a `<nav>` and a
// list of links here, and none of the tablist/tabpanel roles — announcing tabs
// would promise a panel that the caller never handed over.
//
// https://www.systeme-de-design.gouv.fr/version-courante/fr/composants/navigation-tertiaire
import './TabNav.css'
import type { TabNavProps } from './TabNav.types'

export default function TabNav({
    label,
    items,
    currentId,
    onSelect,
}: TabNavProps) {
    return (
        <nav className="shared-tabnav" aria-label={label}>
            <ul className="fr-raw-list shared-tabnav__list">
                {items.map((item) => {
                    // `aria-current="page"` rather than a class of our own: it
                    // is what tells a screen reader which page is open, and the
                    // stylesheet then paints from the same attribute — the way
                    // DSFR marks the current entry of its own navigations. One
                    // source for the state, so it cannot be shown and not
                    // announced.
                    const current = item.id === currentId ? 'page' : undefined

                    return (
                        <li key={item.id}>
                            {item.href === undefined ? (
                                <button
                                    type="button"
                                    className="shared-tabnav__link"
                                    aria-current={current}
                                    onClick={() => onSelect?.(item.id)}
                                >
                                    {item.label}
                                </button>
                            ) : (
                                <a
                                    className="shared-tabnav__link"
                                    href={item.href}
                                    aria-current={current}
                                >
                                    {item.label}
                                </a>
                            )}
                        </li>
                    )
                })}
            </ul>
        </nav>
    )
}
