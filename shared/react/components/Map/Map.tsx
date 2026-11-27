import { useEffect, useRef } from 'react'
import L, {
    type LatLngBoundsExpression,
    type LatLngExpression,
    type PolylineOptions,
} from 'leaflet'
import 'leaflet/dist/leaflet.css'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
import './Map.css'

export type MapProps = {
    center: LatLngExpression
    markers?: LatLngExpression[]
    polygons?: {
        latlngs:
            LatLngExpression[] | LatLngExpression[][] | LatLngExpression[][][]
        options?: PolylineOptions
    }[]
    /** 0 (whole world) to 19 (a street): commune 13, département 9. Ignored with `bounds`. */
    zoom?: number
    /** Takes precedence over `center` and `zoom`. */
    bounds?: LatLngBoundsExpression
}

const DEFAULT_ZOOM = 13

const markerIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41],
})

export default function Map({
    center,
    markers,
    polygons,
    zoom = DEFAULT_ZOOM,
    bounds,
}: MapProps) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const mapRef = useRef<L.Map | null>(null)

    useEffect(() => {
        const defaultCenter: LatLngExpression = [51.505, -0.09]
        const container = containerRef.current
        if (container === null) return

        mapRef.current = L.map(container).setView(defaultCenter, DEFAULT_ZOOM)

        // cf https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/diffusion/wmts/
        const fondTopo = L.tileLayer(
            'https://data.geopf.fr/wmts?' +
                'SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0' +
                '&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2' +
                '&STYLE=normal' +
                '&FORMAT=image/png' +
                '&TILEMATRIXSET=PM' +
                '&TILEMATRIX={z}' +
                '&TILEROW={y}' +
                '&TILECOL={x}',
            {
                attribution: '© IGN – Géoplateforme',
                maxZoom: 19,
            }
        )

        fondTopo.addTo(mapRef.current)

        return () => {
            mapRef.current?.remove()
        }
    }, [])

    useEffect(() => {
        const map = mapRef.current
        if (map === null) return

        if (bounds === undefined) {
            map.setView(center, zoom)
        } else {
            map.fitBounds(bounds)
        }

        const layers = L.layerGroup().addTo(map)

        markers?.forEach((position) => {
            L.marker(position, { icon: markerIcon }).addTo(layers)
        })

        polygons?.forEach(({ latlngs, options }) => {
            L.polygon(latlngs, options).addTo(layers)
        })

        return () => {
            layers.remove()
        }
    }, [bounds, center, markers, polygons, zoom])

    return <div ref={containerRef} className="map" />
}
