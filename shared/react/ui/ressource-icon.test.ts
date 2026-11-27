import { describe, expect, it } from 'vitest'
import {
    COLOR_BY_RESSOURCE_CODE,
    getRessourceIcon,
    ICON_BY_FAMILLE,
} from './ressource-icon'

describe('getRessourceIcon', () => {
    it('gives the icon of the famille and the colour of the ressource', () => {
        expect(
            getRessourceIcon('2B-CIB', '2 Coproduits 1ère transfo Bois')
        ).toEqual({
            iconClassName: 'fr-icon-hammer-line',
            colorToken: '--text-label-yellow-moutarde',
            familleLabel: 'Coproduits 1ère transfo Bois',
        })
    })

    it('falls back on a leaf in grey for an unknown famille and code', () => {
        expect(getRessourceIcon('XX', '9 Inconnue')).toEqual({
            iconClassName: 'fr-icon-leaf-line',
            colorToken: '--text-mention-grey',
            familleLabel: 'Inconnue',
        })
    })

    it('keeps a famille without number as its own label', () => {
        expect(getRessourceIcon('1A-PFA', 'Bois coupé')).toMatchObject({
            iconClassName: 'fr-icon-leaf-line',
            familleLabel: 'Bois coupé',
        })
    })

    it('leaves the label empty when the famille is', () => {
        expect(getRessourceIcon('1A-PFA', '').familleLabel).toBe('')
    })

    it('never gives the same colour twice within a famille', () => {
        const colorsByFamille = new Map<string, string[]>()
        for (const [code, color] of Object.entries(COLOR_BY_RESSOURCE_CODE)) {
            const famille = code.charAt(0)
            colorsByFamille.set(famille, [
                ...(colorsByFamille.get(famille) ?? []),
                color,
            ])
        }

        for (const colors of colorsByFamille.values()) {
            expect(new Set(colors).size).toBe(colors.length)
        }
    })

    it('has an icon for each of the eight familles', () => {
        expect(Object.keys(ICON_BY_FAMILLE)).toHaveLength(8)
    })
})
