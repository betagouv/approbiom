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
})
