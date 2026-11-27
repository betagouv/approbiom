// DSFR's « tag sélectionnable » (DSFR: at most six per filter). The caller
// draws the `fr-tags-group` list.
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
