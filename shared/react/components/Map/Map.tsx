import { useEffect, useRef } from 'react'
import L, { type LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './Map.css'

export type MapProps = {
    /**
     * position of the center of the map
     */
    center: LatLngExpression
    markers?: LatLngExpression[]
    polygons?: LatLngExpression[][]
}

export default function Map({ center, markers, polygons }: MapProps) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const mapRef = useRef<L.Map | null>(null)

    useEffect(() => {
        const container = containerRef.current
        if (container === null) return

        mapRef.current = L.map(container).setView(center, 13)

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
    }, [markers, polygons])

    return <div ref={containerRef} className="map" />
}
