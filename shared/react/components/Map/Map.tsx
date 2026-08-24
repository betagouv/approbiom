import { useEffect, useRef } from 'react'
import L, { type LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './Map.css'

export type MapProps = {
    /**
     * position of the center of the map
     */
    center: LatLngExpression
    /**
     * position of markers if provided
     */
    markers?: LatLngExpression[]
    /**
     * position of polygons
     */
    polygons?: LatLngExpression[][]
    /**
     * zoom level, from 0 (the whole world) to 19 (a street). A commune sits at
     * 13, a département at 9.
     */
    zoom?: number
}

const DEFAULT_ZOOM = 13

export default function Map({
    center,
    markers,
    polygons,
    zoom = DEFAULT_ZOOM,
}: MapProps) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const mapRef = useRef<L.Map | null>(null)

    useEffect(() => {
        const defaultCenter: LatLngExpression = [51.505, -0.09]
        const container = containerRef.current
        if (container === null) return

        mapRef.current = L.map(container).setView(defaultCenter, DEFAULT_ZOOM)

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(mapRef.current)

        return () => {
            mapRef.current?.remove()
        }
    }, [])

    useEffect(() => {
        const map = mapRef.current
        if (map === null) return

        map.setView(center, zoom)

        const layers = L.layerGroup().addTo(map)

        markers?.forEach((position) => {
            L.marker(position).addTo(layers)
        })

        polygons?.forEach((positions) => {
            L.polygon(positions).addTo(layers)
        })

        return () => {
            layers.remove()
        }
    }, [center, markers, polygons, zoom])

    return <div ref={containerRef} className="map" />
}
