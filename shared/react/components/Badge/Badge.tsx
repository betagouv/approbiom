// https://www.systeme-de-design.gouv.fr/version-courante/fr/composants/badge
// `.main` rather than `.min.css`: see Alert.tsx.
import '@gouvfr/dsfr/dist/component/badge/badge.main.min.css'
import type { BadgeProps } from './Badge.types'

export default function Badge({
    children,
    status,
    color,
    size = 'md',
    noIcon,
}: BadgeProps) {
    const className = [
        'fr-badge',
        size === 'sm' && 'fr-badge--sm',
        status && `fr-badge--${status}`,
        color && `fr-badge--${color}`,
        noIcon && 'fr-badge--no-icon',
    ]
        .filter(Boolean)
        .join(' ')

    return <p className={className}>{children}</p>
}
