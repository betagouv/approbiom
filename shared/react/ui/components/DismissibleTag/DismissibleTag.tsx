// DSFR's « tag supprimable »: recalls a filter chosen elsewhere, dropped on click.
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
