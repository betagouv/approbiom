import { useMemo } from 'react'
import { latLngBounds, type LatLngTuple } from 'leaflet'
import Alert from '@shared/react/components/Alert'
import Map from '@shared/react/components/Map'
import type { LocalizationPort } from '@shared/core/application/ports/localization'
import type { Commune } from '@shared/core/domain/value-objects/commune'
import { isCodeDepartement } from '@shared/core/domain/value-objects/departement'

export type ProvenanceMapProps = {
    /** Départements by their code, countries by the libellé they are written under. */
    provenances: readonly string[]
    /** Communes to mark: where the installations drawing on them sit. */
    communes: readonly Commune['codeInsee'][]
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
    communes,
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

        const drawn = [...new Set(provenances)].map(outline)

        const polygons = drawn.flat()

        const markers = [...new Set(communes)].map(
            (codeCommune): LatLngTuple => {
                const { latitude, longitude } =
                    getCommuneCenterPosition(codeCommune)

                return [latitude, longitude]
            }
        )

        // One point per outline — the widest ring of each, which is the shape
        // itself rather than an island of it. A provenance the référentiel
        // does not hold draws nothing and frames nothing.
        const framed = drawn.flatMap((rings) =>
            rings.length === 0
                ? []
                : rings.reduce((widest, ring) =>
                      span(ring) > span(widest) ? ring : widest
                  )
        )

        if (polygons.length === 0 && markers.length === 0) return null

        // A lone marker encloses no area, and fitting bounds to one point
        // zooms to the street. It is centred at the commune zoom instead.
        if (framed.length === 0 && markers.length === 1) {
            return { polygons, markers, center: markers[0], bounds: undefined }
        }

        const bounds = latLngBounds([...framed, ...markers])

        return {
            polygons,
            markers,
            center: bounds.getCenter(),
            bounds,
        }
    }, [
        provenances,
        communes,
        getCommuneCenterPosition,
        getDepartementContour,
        getCountryContour,
    ])

    if (view === null) {
        return (
            <Alert severity="info">
                Aucun lieu n&apos;a pu être situé sur une carte.
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
