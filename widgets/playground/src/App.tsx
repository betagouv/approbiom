import type { LatLngExpression } from 'leaflet'
import Map from '@shared/react/components/Map'

const MARKERS: LatLngExpression[] = [
    [51.5007, -0.1246],
    [51.5055, -0.0754],
    [51.5138, -0.0984],
]

const POLYGONS: LatLngExpression[][] = [
    [
        [51.509, -0.08],
        [51.503, -0.06],
        [51.51, -0.047],
    ],
]

const CENTER: LatLngExpression = [51.505, -0.09]

export default function App() {
    return (
        <main className="app playground">
            <h1 className="fr-h3 playground__title">Playground</h1>

            <section className="playground__section">
                <h2 className="fr-h5">Map</h2>
                <Map center={CENTER} markers={MARKERS} polygons={POLYGONS} />
            </section>
        </main>
    )
}
