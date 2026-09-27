import { describe, expect, it } from 'vitest'
import type { Ressource } from '@shared/core/domain/entities/ressource'
import { matchRessource } from './match-ressource'

const plaquettes: Ressource = {
    code: '1A-PFA',
    ademeCode: '2017-1A-PFA',
    title: 'Plaquettes forestières',
    description: 'Plaquettes forestières dont souches et rémanents',
}
const connexes: Ressource = {
    code: '2B-CIB',
    ademeCode: '2017-2B-CIB',
    title: 'Produits connexes de scierie',
    description: 'Produits connexes de scierie hors écorces',
}
const ressources = [plaquettes, connexes]

describe('matchRessource', () => {
    it('finds the ressource by its ADEME code first', () => {
        expect(
            matchRessource(
                'Plaquettes forestières (référentiel 2017-2B-CIB)',
                ressources
            )
        ).toBe(connexes)
    })

    it('reads the ADEME code whatever its separators', () => {
        expect(matchRessource('référentiel 2017 - 2B - CIB', ressources)).toBe(
            connexes
        )
    })

    it('then by its Approbiom code', () => {
        expect(
            matchRessource(
                'Plaquettes forestières, catégorie 2B-CIB',
                ressources
            )
        ).toBe(connexes)
    })

    it('then by its description', () => {
        expect(
            matchRessource(
                'Plaquettes forestières dont souches et rémanents',
                ressources
            )
        ).toBe(plaquettes)
    })

    it('does not match on the title alone', () => {
        expect(matchRessource('Plaquettes forestières', ressources)).toBeNull()
    })

    it('ignores case and accents in the description', () => {
        expect(
            matchRessource(
                'PLAQUETTES FORESTIERES DONT SOUCHES ET REMANENTS',
                ressources
            )
        ).toBe(plaquettes)
    })

    it('finds the description anywhere in the raw resource', () => {
        expect(
            matchRessource(
                'Sciures et produits connexes de scierie hors écorces',
                ressources
            )
        ).toBe(connexes)
    })

    it('only matches whole words of the description', () => {
        const bois: Ressource = {
            code: 'X',
            ademeCode: '',
            title: 'Bois',
            description: 'Bois',
        }

        expect(matchRessource('Boiseries', [bois])).toBeNull()
    })

    it('prefers the most specific description when several appear', () => {
        const plaquettesSeches: Ressource = {
            code: '1A-PFS',
            ademeCode: '',
            title: 'Plaquettes forestières sèches',
            description:
                'Plaquettes forestières dont souches et rémanents sèches',
        }

        expect(
            matchRessource(
                'Plaquettes forestières dont souches et rémanents sèches',
                [plaquettes, plaquettesSeches]
            )
        ).toBe(plaquettesSeches)
    })

    it('returns null when nothing matches', () => {
        expect(matchRessource('Granulés', ressources)).toBeNull()
    })

    it('returns null for an empty resource', () => {
        expect(
            matchRessource('', [
                ...ressources,
                { code: '', ademeCode: '', title: '', description: '' },
            ])
        ).toBeNull()
    })
})
