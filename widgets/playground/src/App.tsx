import { latLngBounds, type LatLngTuple, type LatLngExpression } from 'leaflet'
import Map from '@shared/react/components/Map'
import ProvenanceMap from '@shared/react/components/Ressource/ProvenanceMap'
import Ressource from '@shared/react/components/Ressource'
import type { ApprovisionnementByRessourceStats } from '@shared/core/application/services/approvisionnement-stats'
import { createLocalizationAdapter } from '@shared/infrastructure/localization/localization-adapter'

/** Anglet, Biarritz and Bayonne — the BAB, near enough to share one view. */
const CODES_INSEE = ['64024', '64122', '64102']
const CODE_DEPARTEMENT = '64'

/** Where the plan's installation sits: Anglet, marked among the provenances. */
const COMMUNE_INSTALLATION = CODES_INSEE[0]

const localization = createLocalizationAdapter()

const MARKERS: LatLngTuple[] = CODES_INSEE.map((codeInsee) => {
    const { latitude, longitude } =
        localization.getCommuneCenterPosition(codeInsee)
    return [latitude, longitude]
})

const CENTER: LatLngExpression = latLngBounds(MARKERS).getCenter()

const CONTOUR: LatLngTuple[][] = localization
    .getDepartementContour(CODE_DEPARTEMENT)
    .map((ring) => ring.map(({ latitude, longitude }) => [latitude, longitude]))

const CONTOUR_CENTER: LatLngExpression = latLngBounds(
    CONTOUR.flat()
).getCenter()

/** What one ressource's `byProvenance` looks like: départements, and a country. */
const PROVENANCES = [
    { provenance: '64', label: 'Pyrénées-Atlantiques' },
    { provenance: '40', label: 'Landes' },
    { provenance: '33', label: 'Gironde' },
    { provenance: 'Espagne', label: 'Espagne' },
    { provenance: 'Portugal', label: 'Portugal' },
].map((group) => ({ ...group, tonnageTotal: 1000, repartition: 0.25 }))

/** Stats standing in for a plan's, so the whole screen can be laid out here. */
const STATS: ApprovisionnementByRessourceStats = [
    {
        ressource: { code: '2017-1A-PFA', title: 'Plaquette forestière' },
        tonnageTotal: 4000,
        repartition: 0.6,
        byRegionOuPays: [
            {
                label: 'Nouvelle-Aquitaine',
                tonnageTotal: 3000,
                repartition: 0.75,
            },
            { label: 'Espagne', tonnageTotal: 1000, repartition: 0.25 },
        ],
        byProvenance: PROVENANCES,
        byFournisseur: [
            { label: 'AFB', tonnageTotal: 2144, repartition: 0.54 },
            { label: 'Barbot et Fils', tonnageTotal: 1856, repartition: 0.46 },
        ],
    },
    {
        ressource: { code: '2017-2B-BOI', title: 'Bois' },
        tonnageTotal: 2600,
        repartition: 0.4,
        byRegionOuPays: [
            {
                label: 'Nouvelle-Aquitaine',
                tonnageTotal: 2600,
                repartition: 1,
            },
        ],
        byProvenance: [
            {
                provenance: '33',
                label: 'Gironde',
                tonnageTotal: 2600,
                repartition: 1,
            },
        ],
        byFournisseur: [{ label: 'TPF', tonnageTotal: 2600, repartition: 1 }],
    },
]

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

            <section className="playground__section">
                <h2 className="fr-h5">
                    ProvenanceMap — plusieurs départements
                </h2>
                <ProvenanceMap
                    provenances={PROVENANCES.map(
                        ({ provenance }) => provenance
                    )}
                    communes={[COMMUNE_INSTALLATION]}
                    getCommuneCenterPosition={
                        localization.getCommuneCenterPosition
                    }
                    getDepartementContour={localization.getDepartementContour}
                    getCountryContour={localization.getCountryContour}
                />
            </section>

            <section className="playground__section">
                <h2 className="fr-h5">Ressource — ventilations et carte</h2>
                <Ressource
                    approvisionnementStatsByRessource={STATS}
                    commune={COMMUNE_INSTALLATION}
                    getCommuneCenterPosition={
                        localization.getCommuneCenterPosition
                    }
                    getDepartementContour={localization.getDepartementContour}
                    getCountryContour={localization.getCountryContour}
                />
            </section>

            <section className="playground__section">
                <h2 className="fr-h5">ProvenanceMap — aucun département</h2>
                <ProvenanceMap
                    provenances={[]}
                    communes={[COMMUNE_INSTALLATION]}
                    getCommuneCenterPosition={
                        localization.getCommuneCenterPosition
                    }
                    getDepartementContour={localization.getDepartementContour}
                    getCountryContour={localization.getCountryContour}
                />
            </section>
        </main>
    )
}
