import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { LocalizationPort } from '@shared/core/application/ports/localization'
import type { ProvenanceGroup } from '@shared/core/application/services/approvisionnement-stats'
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

function provenance(overrides: Partial<ProvenanceGroup> = {}): ProvenanceGroup {
    return {
        provenance: '33',
        label: 'Gironde',
        tonnageTotal: 1000,
        repartition: 1,
        ...overrides,
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

const NOTHING_DRAWN = /Aucune provenance n'a pu être située/

describe('ProvenanceMap', () => {
    it('draws one outline per département of provenance', () => {
        const {
            getCommuneCenterPosition,
            getDepartementContour,
            getCountryContour,
        } = contours()

        const { container } = render(
            <ProvenanceMap
                provenances={[
                    provenance({ provenance: '33' }),
                    provenance({ provenance: '64' }),
                ]}
                commune={null}
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
                provenances={[
                    provenance({ provenance: 'Espagne', label: 'Espagne' }),
                ]}
                commune={null}
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
                provenances={[
                    provenance({ provenance: '64' }),
                    provenance({ provenance: 'Espagne', label: 'Espagne' }),
                ]}
                commune={null}
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
                provenances={[provenance(), provenance()]}
                commune={null}
                getCommuneCenterPosition={getCommuneCenterPosition}
                getDepartementContour={getDepartementContour}
                getCountryContour={getCountryContour}
            />
        )

        expect(getDepartementContour).toHaveBeenCalledTimes(1)
    })

    it('marks the commune the plan’s installation sits at', () => {
        const {
            getCommuneCenterPosition,
            getDepartementContour,
            getCountryContour,
        } = contours()

        const { container } = render(
            <ProvenanceMap
                provenances={[provenance()]}
                commune="33063"
                getCommuneCenterPosition={getCommuneCenterPosition}
                getDepartementContour={getDepartementContour}
                getCountryContour={getCountryContour}
            />
        )

        expect(getCommuneCenterPosition).toHaveBeenCalledWith('33063')
        expect(markers(container)).toHaveLength(1)
    })

    // An installation the document places nowhere has no position to read, and
    // asking for one would throw on a code that is not there.
    it('marks nothing when no commune is given', () => {
        const {
            getCommuneCenterPosition,
            getDepartementContour,
            getCountryContour,
        } = contours()

        const { container } = render(
            <ProvenanceMap
                provenances={[provenance()]}
                commune={null}
                getCommuneCenterPosition={getCommuneCenterPosition}
                getDepartementContour={getDepartementContour}
                getCountryContour={getCountryContour}
            />
        )

        expect(getCommuneCenterPosition).not.toHaveBeenCalled()
        expect(markers(container)).toHaveLength(0)
    })

    it('says as much when there is no provenance at all', () => {
        const {
            getCommuneCenterPosition,
            getDepartementContour,
            getCountryContour,
        } = contours()

        render(
            <ProvenanceMap
                provenances={[]}
                commune={null}
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
                provenances={[
                    provenance({ provenance: 'Sylvanie', label: 'Sylvanie' }),
                ]}
                commune={null}
                getCommuneCenterPosition={getCommuneCenterPosition}
                getDepartementContour={getDepartementContour}
                getCountryContour={() => []}
            />
        )

        expect(screen.getByText(NOTHING_DRAWN)).toBeDefined()
    })
})
