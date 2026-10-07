// DSFR's « tag sélectionnable »: a filter turned on and off. DSFR keeps it to
// six per filter; past that, removable tags under a select read better.
//
// Several of them go in a `fr-tags-group` list, which the caller draws: what
// names the group, and what follows it, depends on the filter.
//
// https://www.systeme-de-design.gouv.fr/version-courante/fr/composants/tag
import '@gouvfr/dsfr/dist/component/tag/tag.main.min.css'

import type { SelectableTagProps } from './SelectableTag.types'

export default function SelectableTag({
    children,
    pressed,
    onToggle,
    title,
    size = 'md',
}: SelectableTagProps) {
    return (
        <button
            type="button"
            className={size === 'sm' ? 'fr-tag fr-tag--sm' : 'fr-tag'}
            aria-pressed={pressed}
            title={title}
            onClick={onToggle}
        >
            {children}
        </button>
    )
}
