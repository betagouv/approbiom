// DSFR's « navigation tertiaire », a beta design with no DSFR code: markup and
// TabNav.css are ours.
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
                    // TabNav.css styles the current item from this attribute.
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
