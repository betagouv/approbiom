import { describe, expect, it } from 'vitest'
import { createInseeCommuneAdapter } from './insee-adapter-commune'

describe('createInseeCommuneAdapter', () => {
    it('gives the centre of a commune the dataset knows', () => {
        // Anglet. Asserted loosely: regenerating the dataset can nudge a centre
        // by a few metres, which is not a regression.
        const position =
            createInseeCommuneAdapter().getCommuneCenterPosition('64024')

        expect(position.latitude).toBeCloseTo(43.49, 1)
        expect(position.longitude).toBeCloseTo(-1.52, 1)
    })

    it('refuses a code no commune carries', () => {
        expect(() =>
            createInseeCommuneAdapter().getCommuneCenterPosition('00000')
        ).toThrow('00000')
    })
})
