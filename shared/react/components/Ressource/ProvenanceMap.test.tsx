import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { LocalizationPort } from '@shared/core/application/ports/localization'
import ProvenanceMap from './ProvenanceMap'

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

/**
 * Spies typed from the port, so a call is asserted against the shape the screen
 * really reads through and not against `any`.
 */
function contours() {
    return {
        getCommuneCenterPosition: vi
            .fn<LocalizationPort['getCommuneCenterPosition']>()
            .mockReturnValue({ latitude: 44.84, longitude: -0.58 }),
        getDepartementContour: vi
            .fn<LocalizationPort['getDepartementContour']>()
            .mockReturnValue(contour),
        getCountryContour: vi
            .fn<LocalizationPort['getCountryContour']>()
            .mockReturnValue(contour),
    }
}

/**
 * Leaflet draws a polygon as an SVG path in the overlay pane. Scoped to that
 * pane rather than the whole container: the attribution control draws paths of
 * its own, and counting those would count the OpenStreetMap flag as a
 * provenance.
 */
function polygons(container: HTMLElement): NodeListOf<SVGPathElement> {
    return container.querySelectorAll('.leaflet-overlay-pane path')
}

/** Leaflet draws a marker as an image in its own pane. */
function markers(container: HTMLElement): NodeListOf<HTMLImageElement> {
    return container.querySelectorAll('.leaflet-marker-pane img')
}

const NOTHING_DRAWN = /Aucun lieu n'a pu être situé/

describe('ProvenanceMap', () => {
    it('draws one outline per département of provenance', () => {
        const {
            getCommuneCenterPosition,
            getDepartementContour,
            getCountryContour,
        } = contours()

        const { container } = render(
            <ProvenanceMap
                provenances={['33', '64']}
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
                provenances={['Espagne']}
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
                provenances={['64', 'Espagne']}
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
                provenances={['33', '33']}
                communes={[]}
                getCommuneCenterPosition={getCommuneCenterPosition}
                getDepartementContour={getDepartementContour}
                getCountryContour={getCountryContour}
            />
        )

        expect(getDepartementContour).toHaveBeenCalledTimes(1)
    })

    // The view is framed on the shapes it drew. A provenance the référentiel
    // does not hold draws none, and framing on it would be framing on nothing.
    it('draws what it can when a provenance is not held', () => {
        const { getCommuneCenterPosition, getDepartementContour } = contours()

        const { container } = render(
            <ProvenanceMap
                provenances={['64', 'Sylvanie']}
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
                provenances={['33']}
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
                provenances={['33']}
                communes={['33063', '33063', '33281']}
                getCommuneCenterPosition={getCommuneCenterPosition}
                getDepartementContour={getDepartementContour}
                getCountryContour={getCountryContour}
            />
        )

        expect(getCommuneCenterPosition).toHaveBeenCalledTimes(2)
        expect(markers(container)).toHaveLength(2)
    })

    // What the concurrence screen asks for: where these plans are, with no
    // territory drawn under them.
    it('draws a map of markers alone', () => {
        const {
            getCommuneCenterPosition,
            getDepartementContour,
            getCountryContour,
        } = contours()

        const { container } = render(
            <ProvenanceMap
                provenances={[]}
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
                provenances={[]}
                communes={[]}
                getCommuneCenterPosition={getCommuneCenterPosition}
                getDepartementContour={getDepartementContour}
                getCountryContour={getCountryContour}
            />
        )

        expect(screen.getByText(NOTHING_DRAWN)).toBeDefined()
    })

    it('says as much when no provenance can be placed', () => {
        // A country the référentiel does not hold answers with no outline.
        const { getCommuneCenterPosition, getDepartementContour } = contours()

        render(
            <ProvenanceMap
                provenances={['Sylvanie']}
                communes={[]}
                getCommuneCenterPosition={getCommuneCenterPosition}
                getDepartementContour={getDepartementContour}
                getCountryContour={() => []}
            />
        )

        expect(screen.getByText(NOTHING_DRAWN)).toBeDefined()
    })
})
