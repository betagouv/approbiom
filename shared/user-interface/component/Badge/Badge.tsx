// DSFR's badge: « une information de type "statut" ou "état" sur un élément du
// site » — where a plan is in its instruction, whether a file was accepted.
//
// It is not `Tag`, which the DSFR keeps separate: a tag says what a piece of
// content *is* — its category, its theme — and can be clicked to filter by it.
// A badge says what state that content is *in*, and is only ever read.
//
// Unlike `Tag`, this one needs no stylesheet of its own. DSFR scopes every
// `fr-tag--<couleur>` rule to `a`/`button`, which is why the read-only tag has
// to have its colours put back by hand; the `fr-badge--*` rules are written
// against no element in particular, so a `<p>` gets them as they ship.
//
// https://www.systeme-de-design.gouv.fr/version-courante/fr/composants/badge
//
// CSS lives next to its component: importing the DSFR badge stylesheet here
// means the styles follow the component into whichever widget uses it. `.main`
// rather than the all-in-one `.min.css` for the reason given in Alert.tsx — the
// legacy sheet's IE hacks fail the build's minifier.
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

    // A `<p>`, as DSFR writes it. The badge is a sentence about the thing next
    // to it, not a heading of its own and not a control — so nothing here
    // claims a role, and the text is left to say what it says.
    return <p className={className}>{children}</p>
}
