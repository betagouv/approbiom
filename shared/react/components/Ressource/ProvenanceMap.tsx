import { useMemo } from 'react'
import { latLngBounds, type LatLngTuple } from 'leaflet'
import Alert from '@shared/react/components/Alert'
import Map from '@shared/react/components/Map'
import type { LocalizationPort } from '@shared/core/application/ports/localization'
import type { ProvenanceGroup } from '@shared/core/application/services/approvisionnement-stats'
import type { Commune } from '@shared/core/domain/value-objects/commune'
import { isCodeDepartement } from '@shared/core/domain/value-objects/departement'

export type ProvenanceMapProps = {
    provenances: readonly ProvenanceGroup[]
    commune: Commune['codeInsee'] | null
    getCommuneCenterPosition: LocalizationPort['getCommuneCenterPosition']
    getDepartementContour: LocalizationPort['getDepartementContour']
    getCountryContour: LocalizationPort['getCountryContour']
}

function span(ring: readonly LatLngTuple[]): number {
    const latitudes = ring.map(([latitude]) => latitude)
    const longitudes = ring.map(([, longitude]) => longitude)

    return Math.max(
        Math.max(...latitudes) - Math.min(...latitudes),
        Math.max(...longitudes) - Math.min(...longitudes)
    )
}

export default function ProvenanceMap({
    provenances,
    commune,
    getCommuneCenterPosition,
    getDepartementContour,
    getCountryContour,
}: ProvenanceMapProps) {
    const view = useMemo(() => {
        const toPolygons = (
            contour: { latitude: number; longitude: number }[][]
        ): LatLngTuple[][] =>
            contour.map((ring) =>
                ring.map(({ latitude, longitude }): LatLngTuple => [
                    latitude,
                    longitude,
                ])
            )

        const outline = (provenance: string): LatLngTuple[][] =>
            toPolygons(
                isCodeDepartement(provenance)
                    ? getDepartementContour(provenance)
                    : getCountryContour(provenance)
            )

        const drawn = [
            ...new Set(provenances.map(({ provenance }) => provenance)),
        ].map(outline)

        const polygons = drawn.flat()
        if (polygons.length === 0) return null

        const bounds = latLngBounds(
            drawn.flatMap((rings) =>
                rings.reduce((widest, ring) =>
                    span(ring) > span(widest) ? ring : widest
                )
            )
        )

        const installation = ((): LatLngTuple | null => {
            if (commune === null) return null

            const { latitude, longitude } = getCommuneCenterPosition(commune)

            return [latitude, longitude]
        })()

        if (installation !== null) bounds.extend(installation)

        return {
            polygons,
            markers: installation === null ? undefined : [installation],
            bounds,
            center: bounds.getCenter(),
        }
    }, [
        provenances,
        commune,
        getCommuneCenterPosition,
        getDepartementContour,
        getCountryContour,
    ])

    if (view === null) {
        return (
            <Alert severity="info">
                Aucune provenance n&apos;a pu être située sur une carte pour
                cette ressource.
            </Alert>
        )
    }

    return (
        <div className="ressource__map">
            <Map
                center={view.center}
                bounds={view.bounds}
                polygons={view.polygons}
                markers={view.markers}
            />
        </div>
    )
}
