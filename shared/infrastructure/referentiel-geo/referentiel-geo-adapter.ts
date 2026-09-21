// Where a commune sits and what a département looks like, read from datasets
// bundled with the widget rather than from the network: both are référentiels
// INSEE/IGN move about once a year, and a map that has to wait on a fetch has
// nothing to draw. `pnpm generate:referentiels` is what refreshes them.
import type { ReferentielGeoPort } from '@shared/core/application/ports/referentiel-geo'
import type { Commune } from '@shared/core/domain/value-objects/commune'
import type { Departement } from '@shared/core/domain/value-objects/departement'
import type { Pays } from '@shared/core/domain/value-objects/pays'
import communesDataset from './communes.json'
import departementsDataset from './departements-contours.json'
import countriesDataset from './countries-contours.json'

type Latitude = number
type Longitude = number

/**
 * ISO 3166-1 alpha-3 — how geoBoundaries keys a country, and so how the
 * dataset does. It stays inside this file: the port reads a country by the
 * libellé a document names it with, so nothing outside has a code to hold.
 */
type CodeIso3 = string

type CommunesDataset = {
    communes: Record<Commune['codeInsee'], CommuneRecord | undefined>
}

type CommuneRecord = {
    nom: Commune['nom']
    latitude: Latitude
    longitude: Longitude
}

type DepartementsDataset = {
    departements: Record<Departement['dep'], DepartementRecord | undefined>
}

type DepartementRecord = {
    nom: Departement['libelle']
    contour: [Latitude, Longitude][][]
}

type CountriesDataset = {
    countries: Record<CodeIso3, CountryRecord | undefined>
}

type CountryRecord = {
    nom: Pays['libelle']
    contour: [Latitude, Longitude][][]
}

const { communes } = communesDataset as CommunesDataset

const { departements } = departementsDataset as unknown as DepartementsDataset

const { countries } = countriesDataset as unknown as CountriesDataset

function normalise(nom: string): string {
    return nom
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .replace(/[^a-z]/g, '')
}

const countryByNom = new Map(
    Object.entries(countries).flatMap(([, country]) =>
        country === undefined
            ? []
            : [[normalise(country.nom), country] as const]
    )
)

/** A stored contour, as the port hands it out. */
function toPositions(contour: [Latitude, Longitude][][]) {
    return contour.map((ring) =>
        ring.map(([latitude, longitude]) => ({ latitude, longitude }))
    )
}

/**
 * The half of {@link ReferentielGeoPort} the bundled datasets answer for. What a
 * document holds — which départements a région gathers — comes from the Grist
 * adapter instead, and the two are read as one port.
 */
export type ReferentielGeoDatasetPort = Pick<
    ReferentielGeoPort,
    'getCommuneCenterPosition' | 'getDepartementContour' | 'getCountryContour'
>

export function createReferentielGeoAdapter(): ReferentielGeoDatasetPort {
    return {
        getCommuneCenterPosition(codeCommune) {
            const commune = communes[codeCommune]
            if (commune === undefined) {
                throw new Error(
                    `no commune carries the INSEE code "${codeCommune}"`
                )
            }

            return {
                latitude: commune.latitude,
                longitude: commune.longitude,
            }
        },

        getDepartementContour(codeDepartement) {
            const departement = departements[codeDepartement]
            if (departement === undefined) {
                throw new Error(
                    `no département carries the code "${codeDepartement}"`
                )
            }

            return toPositions(departement.contour)
        },

        getCountryContour(libelle) {
            const country = countryByNom.get(normalise(libelle))

            return country === undefined ? [] : toPositions(country.contour)
        },
    }
}
