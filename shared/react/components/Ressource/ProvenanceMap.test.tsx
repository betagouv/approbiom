import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ReferentielGeoPort } from '@shared/core/application/ports/referentiel-geo'
import { toProvenance } from '@shared/core/domain/value-objects/provenance'
import ProvenanceMap, { type ProvenanceMapProps } from './ProvenanceMap'

afterEach(() => {
    cleanup()
})

/** A square around Bordeaux, standing in for whatever the référentiel holds. */
const contour = [
    [
        { latitude: 44.8, longitude: -0.6 },
        { latitude: 44.8, longitude: -0.5 },
        { latitude: 44.9, longitude: -0.5 },
        { latitude: 44.9, longitude: -0.6 },
    ],
]

function contours() {
    return {
        getCommuneCenterPosition: vi
            .fn<ReferentielGeoPort['getCommuneCenterPosition']>()
            .mockReturnValue({ latitude: 44.84, longitude: -0.58 }),
        getDepartementContour: vi
            .fn<ReferentielGeoPort['getDepartementContour']>()
            .mockReturnValue(contour),
        getCountryContour: vi
            .fn<ReferentielGeoPort['getCountryContour']>()
            .mockReturnValue(contour),
    }
}

/** Overlay pane only: the attribution control draws SVG paths of its own. */
function polygons(container: HTMLElement): NodeListOf<SVGPathElement> {
    return container.querySelectorAll('.leaflet-overlay-pane path')
}

function markers(container: HTMLElement): NodeListOf<HTMLImageElement> {
    return container.querySelectorAll('.leaflet-marker-pane img')
}

const NOTHING_DRAWN = /Aucun lieu n'a pu être situé/

/** Rows with equal tonnage, for tests not about shading. */
function drawnFrom(
    ...places: string[]
): ProvenanceMapProps['approvisionnements'] {
    return places.map((place) => ({
        provenance: toProvenance(place),
        tonnageTotal: 1000,
    }))
}

describe('ProvenanceMap', () => {
    it('draws one outline per département of provenance', () => {
        const {
            getCommuneCenterPosition,
            getDepartementContour,
            getCountryContour,
        } = contours()

        const { container } = render(
            <ProvenanceMap
                approvisionnements={drawnFrom('33', '64')}
                communes={[]}
                getCommuneCenterPosition={getCommuneCenterPosition}
                getDepartementContour={getDepartementContour}
                getCountryContour={getCountryContour}
            />
        )

        expect(getDepartementContour.mock.calls.map(([code]) => code)).toEqual([
            '33',
            '64',
        ])
        expect(getCountryContour).not.toHaveBeenCalled()
        expect(polygons(container)).toHaveLength(2)
    })

    it('draws a foreign provenance by the name it is written under', () => {
        const {
            getCommuneCenterPosition,
            getDepartementContour,
            getCountryContour,
        } = contours()

        const { container } = render(
            <ProvenanceMap
                approvisionnements={drawnFrom('Espagne')}
                communes={[]}
                getCommuneCenterPosition={getCommuneCenterPosition}
                getDepartementContour={getDepartementContour}
                getCountryContour={getCountryContour}
            />
        )

        expect(getCountryContour).toHaveBeenCalledWith('Espagne')
        expect(getDepartementContour).not.toHaveBeenCalled()
        expect(polygons(container)).toHaveLength(1)
    })

    it('draws départements and countries on the same map', () => {
        const {
            getCommuneCenterPosition,
            getDepartementContour,
            getCountryContour,
        } = contours()

        const { container } = render(
            <ProvenanceMap
                approvisionnements={drawnFrom('64', 'Espagne')}
                communes={[]}
                getCommuneCenterPosition={getCommuneCenterPosition}
                getDepartementContour={getDepartementContour}
                getCountryContour={getCountryContour}
            />
        )

        expect(polygons(container)).toHaveLength(2)
    })

    it('reads a provenance once, however many rows name it', () => {
        const {
            getCommuneCenterPosition,
            getDepartementContour,
            getCountryContour,
        } = contours()

        render(
            <ProvenanceMap
                approvisionnements={drawnFrom('33', '33')}
                communes={[]}
                getCommuneCenterPosition={getCommuneCenterPosition}
                getDepartementContour={getDepartementContour}
                getCountryContour={getCountryContour}
            />
        )

        expect(getDepartementContour).toHaveBeenCalledTimes(1)
    })

    it('draws what it can when a provenance is not held', () => {
        const { getCommuneCenterPosition, getDepartementContour } = contours()

        const { container } = render(
            <ProvenanceMap
                approvisionnements={drawnFrom('64', 'Sylvanie')}
                communes={[]}
                getCommuneCenterPosition={getCommuneCenterPosition}
                getDepartementContour={getDepartementContour}
                getCountryContour={() => []}
            />
        )

        expect(polygons(container)).toHaveLength(1)
    })

    it('marks the commune an installation sits at', () => {
        const {
            getCommuneCenterPosition,
            getDepartementContour,
            getCountryContour,
        } = contours()

        const { container } = render(
            <ProvenanceMap
                approvisionnements={drawnFrom('33')}
                communes={['33063']}
                getCommuneCenterPosition={getCommuneCenterPosition}
                getDepartementContour={getDepartementContour}
                getCountryContour={getCountryContour}
            />
        )

        expect(getCommuneCenterPosition).toHaveBeenCalledWith('33063')
        expect(markers(container)).toHaveLength(1)
    })

    it('reads a commune once, however many rows name it', () => {
        const {
            getCommuneCenterPosition,
            getDepartementContour,
            getCountryContour,
        } = contours()

        const { container } = render(
            <ProvenanceMap
                approvisionnements={drawnFrom('33')}
                communes={['33063', '33063', '33281']}
                getCommuneCenterPosition={getCommuneCenterPosition}
                getDepartementContour={getDepartementContour}
                getCountryContour={getCountryContour}
            />
        )

        expect(getCommuneCenterPosition).toHaveBeenCalledTimes(2)
        expect(markers(container)).toHaveLength(2)
    })

    it('marks the communes it can when one is not held', () => {
        const { getDepartementContour, getCountryContour } = contours()
        const getCommuneCenterPosition = vi
            .fn<ReferentielGeoPort['getCommuneCenterPosition']>()
            .mockImplementation((codeCommune) =>
                codeCommune === '00000'
                    ? undefined
                    : { latitude: 44.84, longitude: -0.58 }
            )

        const { container } = render(
            <ProvenanceMap
                approvisionnements={drawnFrom('33')}
                communes={['33063', '00000']}
                getCommuneCenterPosition={getCommuneCenterPosition}
                getDepartementContour={getDepartementContour}
                getCountryContour={getCountryContour}
            />
        )

        expect(markers(container)).toHaveLength(1)
        expect(polygons(container)).toHaveLength(1)
    })

    it('says as much when no commune can be placed', () => {
        const { getDepartementContour, getCountryContour } = contours()

        render(
            <ProvenanceMap
                approvisionnements={[]}
                communes={['00000']}
                getCommuneCenterPosition={() => undefined}
                getDepartementContour={getDepartementContour}
                getCountryContour={getCountryContour}
            />
        )

        expect(screen.getByText(NOTHING_DRAWN)).toBeDefined()
    })

    it('draws what it can when a département is not held', () => {
        const { getCommuneCenterPosition, getCountryContour } = contours()

        const { container } = render(
            <ProvenanceMap
                approvisionnements={drawnFrom('33', '64')}
                communes={[]}
                getCommuneCenterPosition={getCommuneCenterPosition}
                getDepartementContour={(code) => (code === '64' ? [] : contour)}
                getCountryContour={getCountryContour}
            />
        )

        expect(polygons(container)).toHaveLength(1)
    })

    it('draws a map of markers alone', () => {
        const {
            getCommuneCenterPosition,
            getDepartementContour,
            getCountryContour,
        } = contours()

        const { container } = render(
            <ProvenanceMap
                approvisionnements={[]}
                communes={['33063', '33281']}
                getCommuneCenterPosition={getCommuneCenterPosition}
                getDepartementContour={getDepartementContour}
                getCountryContour={getCountryContour}
            />
        )

        expect(polygons(container)).toHaveLength(0)
        expect(markers(container)).toHaveLength(2)
        expect(screen.queryByText(NOTHING_DRAWN)).toBeNull()
    })

    it('says as much when there is nothing to place at all', () => {
        const {
            getCommuneCenterPosition,
            getDepartementContour,
            getCountryContour,
        } = contours()

        render(
            <ProvenanceMap
                approvisionnements={[]}
                communes={[]}
                getCommuneCenterPosition={getCommuneCenterPosition}
                getDepartementContour={getDepartementContour}
                getCountryContour={getCountryContour}
            />
        )

        expect(screen.getByText(NOTHING_DRAWN)).toBeDefined()
    })

    it('says as much when no provenance can be placed', () => {
        const { getCommuneCenterPosition, getDepartementContour } = contours()

        render(
            <ProvenanceMap
                approvisionnements={drawnFrom('Sylvanie')}
                communes={[]}
                getCommuneCenterPosition={getCommuneCenterPosition}
                getDepartementContour={getDepartementContour}
                getCountryContour={() => []}
            />
        )

        expect(screen.getByText(NOTHING_DRAWN)).toBeDefined()
    })
})
