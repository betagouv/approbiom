import { describe, expect, it } from 'vitest'
import { transformProvenance } from './transform-provenance'
import { loadReferenceData } from './reference-data'

const reference = loadReferenceData()

const sharesOf = (raw: string) =>
    transformProvenance(raw, reference).distribution.map(
        ({ provenance, percentage }) => [provenance, percentage]
    )

describe('transformProvenance', () => {
    it('keeps the written shares', () => {
        expect(sharesOf('70% 19, 30% Espagne')).toEqual([
            ['19', 70],
            ['Espagne', 30],
        ])
    })

    it('leaves an unrecognised share missing instead of spreading it', () => {
        const result = transformProvenance(
            '40% Grand Est, 60% Allemagne',
            reference
        )

        expect(sharesOf('40% Grand Est, 60% Allemagne')).toEqual([
            ['Allemagne', 60],
        ])
        expect(result.confidence).toBe('À vérifier')
        expect(result.unrecognized).toContain('grand est')
    })

    it('splits evenly when no share is written', () => {
        expect(sharesOf('88, 54')).toEqual([
            ['88', 50],
            ['54', 50],
        ])
    })

    it('gives the places without a share what is left', () => {
        expect(sharesOf('60% 88, 68, 54')).toEqual([
            ['88', 60],
            ['68', 20],
            ['54', 20],
        ])
    })

    it.each([
        ['Pyrénées-Atlantique', '64'],
        ['Haute-Pyrénée', '65'],
        ['Vosge', '88'],
    ])('reads « %s » without its final s', (name, code) => {
        expect(sharesOf(`100% ${name}`)).toEqual([[code, 100]])
    })

    it('keeps each share on its place when a name lacks its final s', () => {
        expect(
            sharesOf(
                'Pyrénées-Atlantique (25%), Landes (40%), Gers (25%), Hautes-Pyrénées (10%)'
            )
        ).toEqual([
            ['64', 25],
            ['40', 40],
            ['32', 25],
            ['65', 10],
        ])
    })
})
