import '@gouvfr/dsfr/dist/utility/icons/icons-business/icons-business.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-design/icons-design.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-map/icons-map.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-others/icons-others.main.min.css'
import type { Ressource } from '@shared/core/domain/value-objects/ressource'

/** A DSFR illustrative colour name, e.g. « green-bourgeon ». */
export type DsfrIllustrativeColor =
    | 'green-tilleul-verveine'
    | 'green-bourgeon'
    | 'green-emeraude'
    | 'green-menthe'
    | 'green-archipel'
    | 'blue-ecume'
    | 'blue-cumulus'
    | 'purple-glycine'
    | 'pink-macaron'
    | 'pink-tuile'
    | 'yellow-tournesol'
    | 'yellow-moutarde'
    | 'orange-terre-battue'
    | 'brown-cafe-creme'
    | 'brown-caramel'
    | 'brown-opera'
    | 'beige-gris-galet'

/** Keyed by the number the « Famille ressource » label starts with. */
export const ICON_BY_FAMILLE: Readonly<Record<string, string>> = {
    '1': 'fr-icon-plant-fill',
    '2': 'fr-icon-hammer-fill',
    '3': 'fr-icon-recycle-fill',
    '4': 'fr-icon-bubble-chart-fill',
    '5': 'fr-icon-seedling-fill',
    '6': 'fr-icon-drop-fill',
    '7': 'fr-icon-gas-station-fill',
    '8': 'fr-icon-stack-fill',
}

const DEFAULT_ICON = 'fr-icon-leaf-fill'

/**
 * The `--text-label-*` tokens keep their contrast in both themes but are
 * muted: only eight of them read as distinct hues (green, olive, teal, blue,
 * navy, plum, red, rust). Within a famille, a ressource never shares its hue.
 */
export const COLOR_BY_RESSOURCE_CODE: Readonly<
    Record<Ressource['code'], DsfrIllustrativeColor>
> = {
    '1A-PFA': 'green-bourgeon',
    '1A-PFA-1': 'yellow-tournesol',
    '1A-PFA-2': 'green-archipel',
    '1B-PFA': 'blue-cumulus',
    '1C-PFA': 'blue-ecume',
    '1D-BR': 'pink-macaron',
    '1D-BR-1': 'pink-tuile',
    '1D-BR-2': 'purple-glycine',
    '2A-CIB': 'pink-macaron',
    '2B-CIB': 'yellow-tournesol',
    '2C-LN': 'blue-ecume',
    '2D-TO': 'pink-tuile',
    '2E-LB': 'green-archipel',
    '3A-BFVBD': 'green-bourgeon',
    '3BR1-BFVBD': 'blue-cumulus',
    '3BR2-BFVBD': 'purple-glycine',
    '3C-BFVBD': 'pink-tuile',
    '4A-GR': 'pink-macaron',
    '4B-GR': 'green-bourgeon',
    '4C-GR': 'pink-tuile',
    '5A-CVE': 'green-bourgeon',
    '5A-CVE-1': 'green-archipel',
    '5A-CVE-2': 'yellow-tournesol',
    '5B-CIVE': 'blue-cumulus',
    '5C-CA': 'pink-macaron',
    Autre: 'beige-gris-galet',
    '6A-STEPI': 'purple-glycine',
    '6B-STEPU': 'blue-cumulus',
    '6C-PAPET': 'green-archipel',
    '6D-REFUS': 'yellow-tournesol',
    '7A-FUEL': 'blue-ecume',
    '7B-CHAR': 'beige-gris-galet',
    '8A-PLA': 'pink-macaron',
}

const DEFAULT_COLOR_TOKEN = '--text-mention-grey'

export type RessourceIcon = {
    iconClassName: string
    /** A CSS custom property name, to use as `var(colorToken)`. */
    colorToken: string
    /** The famille without its leading number, e.g. « Bois coupé ». */
    familleLabel: string
}

export function getRessourceIcon(
    code: Ressource['code'],
    famille: Ressource['famille']
): RessourceIcon {
    const [, number = '', label = famille] =
        /^\s*(\d+)\s+(.*)$/.exec(famille) ?? []
    const color = COLOR_BY_RESSOURCE_CODE[code] as
        DsfrIllustrativeColor | undefined

    return {
        iconClassName: ICON_BY_FAMILLE[number] ?? DEFAULT_ICON,
        colorToken: color ? `--text-label-${color}` : DEFAULT_COLOR_TOKEN,
        familleLabel: label.trim(),
    }
}
