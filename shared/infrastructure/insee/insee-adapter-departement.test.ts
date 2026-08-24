import { describe, expect, it } from 'vitest'
import { createInseeDepartementAdapter } from './insee-adapter-departement'

describe('createInseeDepartementAdapter', () => {
    it('gives an outline that closes back on itself', () => {
        const [contour, ...others] =
            createInseeDepartementAdapter().getDepartementContour('64')

        expect(others).toHaveLength(0)
        expect(contour.length).toBeGreaterThan(100)
        expect(contour.at(-1)).toEqual(contour[0])
    })

    it('gives an outline the communes of the département fall inside', () => {
        // Anglet, on the coast, is the western edge of the case.
        const [contour] =
            createInseeDepartementAdapter().getDepartementContour('64')
        const latitudes = contour.map(({ latitude }) => latitude)
        const longitudes = contour.map(({ longitude }) => longitude)

        expect(Math.min(...latitudes)).toBeLessThan(43.49)
        expect(Math.max(...latitudes)).toBeGreaterThan(43.49)
        expect(Math.min(...longitudes)).toBeLessThan(-1.52)
        expect(Math.max(...longitudes)).toBeGreaterThan(-1.52)
    })

    it('refuses a code no département carries', () => {
        expect(() =>
            createInseeDepartementAdapter().getDepartementContour('99')
        ).toThrow('99')
    })
})
