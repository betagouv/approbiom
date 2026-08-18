// A tag that is read, not clicked: a label saying what a piece of content
// belongs to. DSFR's other two forms — `<a>` and `<button>` — are tags that do
// something (open a search, drop a filter) and are not what this component is.
//
// That distinction is also why the colours are painted in Tag.css: DSFR scopes
// every `fr-tag--<couleur>` rule to those clickable forms, so a `<p>` given one
// stays grey. See the stylesheet for how they are put back.
import '@gouvfr/dsfr/dist/component/tag/tag.main.min.css'
import './Tag.css'
import type { TagProps } from './Tag.types'

export default function Tag({ children, color, size = 'md' }: TagProps) {
    const className = [
        'fr-tag',
        'shared-tag',
        size === 'sm' && 'fr-tag--sm',
        color && `fr-tag--${color}`,
    ]
        .filter(Boolean)
        .join(' ')

    return <p className={className}>{children}</p>
}
