import { useMemo } from 'react'
import { latLngBounds, type LatLngTuple } from 'leaflet'
import Alert from '@shared/react/components/Alert'
import Map from '@shared/react/components/Map'
import type { LocalizationPort } from '@shared/core/application/ports/localization'
import type { Commune } from '@shared/core/domain/value-objects/commune'
import { isCodeDepartement } from '@shared/core/domain/value-objects/departement'
import {
    getProvenanceLabel,
    toProvenance,
    type Provenance,
} from '@shared/core/domain/value-objects/provenance'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { MapProps } from '../Map/Map'

export type ProvenanceMapProps = {
    approvisionnements: readonly Pick<
        Approvisionnement,
        'tonnageTotal' | 'provenance'
    >[]
    communes: readonly Commune['codeInsee'][]
    getCommuneCenterPosition: LocalizationPort['getCommuneCenterPosition']
    getDepartementContour: LocalizationPort['getDepartementContour']
    getCountryContour: LocalizationPort['getCountryContour']
}

const MINIMUM_FILL_OPACITY = 0.15
const MAXIMUM_FILL_OPACITY = 0.6

function span(ring: readonly LatLngTuple[]): number {
    const latitudes = ring.map(([latitude]) => latitude)
    const longitudes = ring.map(([, longitude]) => longitude)

    return Math.max(
        Math.max(...latitudes) - Math.min(...latitudes),
        Math.max(...longitudes) - Math.min(...longitudes)
    )
}

function getFillOpacity(tonnage: number, heaviest: number): number {
    if (heaviest <= 0) return MINIMUM_FILL_OPACITY

    const share = Math.min(Math.max(tonnage / heaviest, 0), 1)

    return (
        MINIMUM_FILL_OPACITY +
        share * (MAXIMUM_FILL_OPACITY - MINIMUM_FILL_OPACITY)
    )
}

export default function ProvenanceMap({
    approvisionnements,
    communes,
    getCommuneCenterPosition,
    getDepartementContour,
    getCountryContour,
}: ProvenanceMapProps) {
    const view = useMemo(() => {
        const toRings = (
            contour: { latitude: number; longitude: number }[][]
        ): LatLngTuple[][] =>
            contour.map((ring) =>
                ring.map(({ latitude, longitude }): LatLngTuple => [
                    latitude,
                    longitude,
                ])
            )

        const getContour = (provenance: Provenance): LatLngTuple[][] => {
            const label = getProvenanceLabel(provenance)
            return toRings(
                isCodeDepartement(label)
                    ? getDepartementContour(label)
                    : getCountryContour(label)
            )
        }

        const getTonnageTotal = (provenance: Provenance): number =>
            approvisionnements
                .filter(
                    ({ provenance: named }) =>
                        getProvenanceLabel(named) ===
                        getProvenanceLabel(provenance)
                )
                .reduce((total, { tonnageTotal }) => total + tonnageTotal, 0)

        const provenances = [
            ...new Set(
                approvisionnements.map(({ provenance }) =>
                    getProvenanceLabel(provenance)
                )
            ),
        ].map(toProvenance)

        const heaviest = Math.max(0, ...provenances.map(getTonnageTotal))

        const polygons = provenances
            .map((provenance) => ({
                latlngs: getContour(provenance),
                options: {
                    fillOpacity: getFillOpacity(
                        getTonnageTotal(provenance),
                        heaviest
                    ),
                },
            }))
            .filter(({ latlngs }) => latlngs.length > 0) satisfies NonNullable<
            MapProps['polygons']
        >

        const markers = [...new Set(communes)].map(
            (codeCommune): LatLngTuple => {
                const { latitude, longitude } =
                    getCommuneCenterPosition(codeCommune)

                return [latitude, longitude]
            }
        )

        const framed = polygons.flatMap(({ latlngs }) =>
            latlngs.reduce((widest, ring) =>
                span(ring) > span(widest) ? ring : widest
            )
        )

        if (polygons.length === 0 && markers.length === 0) return null

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
        approvisionnements,
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
