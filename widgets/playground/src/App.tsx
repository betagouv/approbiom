import { latLngBounds, type LatLngTuple, type LatLngExpression } from 'leaflet'
import Map from '@shared/react/components/Map'
import { createInseeCommuneAdapter } from '@shared/infrastructure/insee/insee-adapter-commune'
import { createInseeDepartementAdapter } from '@shared/infrastructure/insee/insee-adapter-departement'

/** Anglet, Biarritz and Bayonne — the BAB, near enough to share one view. */
const CODES_INSEE = ['64024', '64122', '64102']
const CODE_DEPARTEMENT = '64'

const communes = createInseeCommuneAdapter()
const departements = createInseeDepartementAdapter()

const MARKERS: LatLngTuple[] = CODES_INSEE.map((codeInsee) => {
    const { latitude, longitude } = communes.getCommuneCenterPosition(codeInsee)
    return [latitude, longitude]
})

const CENTER: LatLngExpression = latLngBounds(MARKERS).getCenter()

const CONTOUR: LatLngTuple[][] = departements
    .getDepartementContour(CODE_DEPARTEMENT)
    .map((ring) => ring.map(({ latitude, longitude }) => [latitude, longitude]))

const CONTOUR_CENTER: LatLngExpression = latLngBounds(
    CONTOUR.flat()
).getCenter()

export default function App() {
    return (
        <main className="app playground">
            <h1 className="fr-h3 playground__title">Playground</h1>

            <section className="playground__section">
                <h2 className="fr-h5">Map — communes</h2>
                <Map center={CENTER} markers={MARKERS} polygons={[MARKERS]} />
            </section>

            <section className="playground__section">
                <h2 className="fr-h5">Map — contour d’un département</h2>
                <Map
                    center={CONTOUR_CENTER}
                    markers={MARKERS}
                    polygons={CONTOUR}
                    zoom={9}
                />
            </section>
        </main>
    )
}
