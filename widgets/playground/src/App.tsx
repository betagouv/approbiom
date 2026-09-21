import { latLngBounds, type LatLngTuple, type LatLngExpression } from 'leaflet'
import Map from '@shared/react/components/Map'
import ProvenanceMap, {
    type ProvenanceMapProps,
} from '@shared/react/components/Ressource/ProvenanceMap'
import type { ProvenanceGroup } from '@shared/core/application/services/approvisionnement-stats'
import { createReferentielGeoAdapter } from '@shared/infrastructure/referentiel-geo/referentiel-geo-adapter'
import { toProvenance } from '@shared/core/domain/value-objects/provenance'

/** Anglet, Biarritz and Bayonne — the BAB, near enough to share one view. */
const CODES_INSEE = ['64024', '64122', '64102']
const CODE_DEPARTEMENT = '64'

/** Where the plan's installation sits: Anglet, marked among the provenances. */
const COMMUNE_INSTALLATION = CODES_INSEE[0]

const referentielGeo = createReferentielGeoAdapter()

const MARKERS: LatLngTuple[] = CODES_INSEE.map((codeInsee) => {
    const { latitude, longitude } =
        referentielGeo.getCommuneCenterPosition(codeInsee)
    return [latitude, longitude]
})

const CENTER: LatLngExpression = latLngBounds(MARKERS).getCenter()

const CONTOUR: LatLngTuple[][] = referentielGeo
    .getDepartementContour(CODE_DEPARTEMENT)
    .map((ring) => ring.map(({ latitude, longitude }) => [latitude, longitude]))

const CONTOUR_CENTER: LatLngExpression = latLngBounds(
    CONTOUR.flat()
).getCenter()

/**
 * What one ressource's `byProvenance` looks like: départements, and a country.
 * Their tonnages are spread wide apart on purpose — the map fills a provenance
 * the more solidly the more it draws, and provenances that all draw the same
 * would show that off as one flat shade.
 */
const TONNAGES = [
    { provenance: '64', label: 'Pyrénées-Atlantiques', tonnageTotal: 4000 },
    { provenance: '40', label: 'Landes', tonnageTotal: 2500 },
    { provenance: '33', label: 'Gironde', tonnageTotal: 1200 },
    { provenance: 'Espagne', label: 'Espagne', tonnageTotal: 600 },
    { provenance: 'Portugal', label: 'Portugal', tonnageTotal: 200 },
]

const TONNAGE_TOTAL = TONNAGES.reduce(
    (total, { tonnageTotal }) => total + tonnageTotal,
    0
)

const PROVENANCES: ProvenanceGroup[] = TONNAGES.map((group) => ({
    ...group,
    repartition: group.tonnageTotal / TONNAGE_TOTAL,
}))

/**
 * The same places as the approvisionnements they are grouped from: the stats
 * name a provenance, the domain says what kind of place that name is.
 */
const APPROVISIONNEMENTS: ProvenanceMapProps['approvisionnements'] =
    PROVENANCES.map(({ provenance, tonnageTotal }) => ({
        provenance: toProvenance(provenance),
        tonnageTotal,
    }))

export default function App() {
    return (
        <main className="app playground">
            <h1 className="fr-h3 playground__title">Playground</h1>

            <section className="playground__section">
                <h2 className="fr-h5">Map — communes</h2>
                <Map
                    center={CENTER}
                    markers={MARKERS}
                    polygons={[{ latlngs: MARKERS }]}
                />
            </section>

            <section className="playground__section">
                <h2 className="fr-h5">Map — contour d’un département</h2>
                <Map
                    center={CONTOUR_CENTER}
                    markers={MARKERS}
                    polygons={CONTOUR.map((ring) => ({ latlngs: ring }))}
                    zoom={9}
                />
            </section>

            <section className="playground__section">
                <h2 className="fr-h5">
                    ProvenanceMap — plusieurs départements
                </h2>
                <ProvenanceMap
                    approvisionnements={APPROVISIONNEMENTS}
                    communes={[COMMUNE_INSTALLATION]}
                    getCommuneCenterPosition={
                        referentielGeo.getCommuneCenterPosition
                    }
                    getDepartementContour={referentielGeo.getDepartementContour}
                    getCountryContour={referentielGeo.getCountryContour}
                />
            </section>

            <section className="playground__section">
                <h2 className="fr-h5">ProvenanceMap — aucun département</h2>
                <ProvenanceMap
                    approvisionnements={[]}
                    communes={[COMMUNE_INSTALLATION]}
                    getCommuneCenterPosition={
                        referentielGeo.getCommuneCenterPosition
                    }
                    getDepartementContour={referentielGeo.getDepartementContour}
                    getCountryContour={referentielGeo.getCountryContour}
                />
            </section>
        </main>
    )
}
