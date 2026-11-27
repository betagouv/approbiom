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
    '1': 'fr-icon-plant-line',
    '2': 'fr-icon-hammer-line',
    '3': 'fr-icon-recycle-line',
    '4': 'fr-icon-bubble-chart-line',
    '5': 'fr-icon-seedling-line',
    '6': 'fr-icon-drop-line',
    '7': 'fr-icon-gas-station-line',
    '8': 'fr-icon-stack-line',
}

const DEFAULT_ICON = 'fr-icon-leaf-line'

/** Never twice the same colour within a famille: the icon tells famille apart. */
export const COLOR_BY_RESSOURCE_CODE: Readonly<
    Record<Ressource['code'], DsfrIllustrativeColor>
> = {
    '1A-PFA': 'green-bourgeon',
    '1A-PFA-1': 'green-emeraude',
    '1A-PFA-2': 'green-menthe',
    '1B-PFA': 'green-tilleul-verveine',
    '1C-PFA': 'green-archipel',
    '1D-BR': 'brown-caramel',
    '1D-BR-1': 'brown-cafe-creme',
    '1D-BR-2': 'brown-opera',
    '2B-CIB': 'yellow-moutarde',
    '2A-CIB': 'brown-caramel',
    '2C-LN': 'purple-glycine',
    '2D-TO': 'yellow-tournesol',
    '2E-LB': 'blue-cumulus',
    '3A-BFVBD': 'pink-tuile',
    '3BR1-BFVBD': 'orange-terre-battue',
    '3BR2-BFVBD': 'pink-macaron',
    '3C-BFVBD': 'purple-glycine',
    '4A-GR': 'brown-cafe-creme',
    '4B-GR': 'green-tilleul-verveine',
    '4C-GR': 'orange-terre-battue',
    '5A-CVE': 'green-bourgeon',
    '5A-CVE-1': 'green-menthe',
    '5A-CVE-2': 'green-emeraude',
    '5B-CIVE': 'yellow-tournesol',
    '5C-CA': 'yellow-moutarde',
    Autre: 'beige-gris-galet',
    '6A-STEPI': 'blue-ecume',
    '6B-STEPU': 'blue-cumulus',
    '6C-PAPET': 'green-archipel',
    '6D-REFUS': 'purple-glycine',
    '7A-FUEL': 'brown-opera',
    '7B-CHAR': 'beige-gris-galet',
    '8A-PLA': 'brown-caramel',
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
