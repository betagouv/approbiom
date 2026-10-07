// DSFR's « tag supprimable »: recalls a filter chosen elsewhere — in a list,
// say — and drops it when clicked. DSFR pairs it with a select once a filter
// has more than six options, where selectable tags would be too many.
//
// https://www.systeme-de-design.gouv.fr/version-courante/fr/composants/tag
import '@gouvfr/dsfr/dist/component/tag/tag.main.min.css'

import type { DismissibleTagProps } from './DismissibleTag.types'

export default function DismissibleTag({
    children,
    dismissLabel,
    onDismiss,
    size = 'md',
}: DismissibleTagProps) {
    return (
        <button
            type="button"
            className={
                size === 'sm'
                    ? 'fr-tag fr-tag--sm fr-tag--dismiss'
                    : 'fr-tag fr-tag--dismiss'
            }
            aria-label={dismissLabel}
            onClick={onDismiss}
        >
            {children}
        </button>
    )
}
