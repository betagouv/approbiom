// Non-interactive DSFR tag. DSFR scopes `fr-tag--<couleur>` to
// `<a>`/`<button>`, so Tag.css restores the colours.
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
