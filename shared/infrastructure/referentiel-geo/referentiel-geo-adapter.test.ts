import { describe, expect, it } from 'vitest'
import { createReferentielGeoAdapter } from './referentiel-geo-adapter'

describe('createReferentielGeoAdapter', () => {
    describe('getCommuneCenterPosition', () => {
        it('gives the centre of a commune the dataset knows', () => {
            // Anglet. Asserted loosely: regenerating the dataset can nudge a
            // centre by a few metres, which is not a regression.
            const position =
                createReferentielGeoAdapter().getCommuneCenterPosition('64024')

            expect(position.latitude).toBeCloseTo(43.49, 1)
            expect(position.longitude).toBeCloseTo(-1.52, 1)
        })

        it('refuses a code no commune carries', () => {
            expect(() =>
                createReferentielGeoAdapter().getCommuneCenterPosition('00000')
            ).toThrow('00000')
        })
    })

    describe('getCountryContour', () => {
        it('gives an outline for a country named in French', () => {
            const contour =
                createReferentielGeoAdapter().getCountryContour('Espagne')

            const points = contour.flat()
            const latitudes = points.map(({ latitude }) => latitude)
            const longitudes = points.map(({ longitude }) => longitude)

            // Spain reaches from the Pyrenees down to the Canaries, which is
            // enough to say the right country came back without pinning the
            // test to the généralisation. More than one ring, for the islands.
            expect(contour.length).toBeGreaterThan(1)
            expect(Math.min(...latitudes)).toBeGreaterThan(27)
            expect(Math.max(...latitudes)).toBeLessThan(44)
            expect(Math.min(...longitudes)).toBeGreaterThan(-19)
            expect(Math.max(...longitudes)).toBeLessThan(5)
        })

        it('reads a name however it is accented or cased', () => {
            const referentielGeo = createReferentielGeoAdapter()

            expect(referentielGeo.getCountryContour("COTE D'IVOIRE")).toEqual(
                referentielGeo.getCountryContour('Côte d’Ivoire')
            )
        })

        it('gives no outline for a name no country is known by', () => {
            expect(
                createReferentielGeoAdapter().getCountryContour('Sylvanie')
            ).toEqual([])
        })
    })

    describe('getDepartementContour', () => {
        it('gives an outline that closes back on itself', () => {
            const [contour, ...others] =
                createReferentielGeoAdapter().getDepartementContour('64')

            expect(others).toHaveLength(0)
            expect(contour.length).toBeGreaterThan(100)
            expect(contour.at(-1)).toEqual(contour[0])
        })

        it('gives an outline the communes of the département fall inside', () => {
            // Anglet, on the coast, is the western edge of the case.
            const [contour] =
                createReferentielGeoAdapter().getDepartementContour('64')
            const latitudes = contour.map(({ latitude }) => latitude)
            const longitudes = contour.map(({ longitude }) => longitude)

            expect(Math.min(...latitudes)).toBeLessThan(43.49)
            expect(Math.max(...latitudes)).toBeGreaterThan(43.49)
            expect(Math.min(...longitudes)).toBeLessThan(-1.52)
            expect(Math.max(...longitudes)).toBeGreaterThan(-1.52)
        })

        it('refuses a code no département carries', () => {
            expect(() =>
                createReferentielGeoAdapter().getDepartementContour('99')
            ).toThrow('99')
        })
    })
})
