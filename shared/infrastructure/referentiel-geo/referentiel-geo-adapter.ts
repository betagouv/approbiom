// Commune positions and département/country contours, read from datasets bundled
// with the widget. Refreshed with `pnpm generate:referentiels`.
import type { ReferentielGeoPort } from '@shared/core/application/ports/referentiel-geo'
import type { Commune } from '@shared/core/domain/value-objects/commune'
import type { Departement } from '@shared/core/domain/value-objects/departement'
import type { Pays } from '@shared/core/domain/value-objects/pays'
import communesDataset from './communes.json'
import departementsDataset from './departements-contours.json'
import countriesDataset from './countries-contours.json'

type Latitude = number
type Longitude = number

/** ISO 3166-1 alpha-3, how geoBoundaries keys a country. */
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

function toPositions(contour: [Latitude, Longitude][][]) {
    return contour.map((ring) =>
        ring.map(([latitude, longitude]) => ({ latitude, longitude }))
    )
}

/** The part of {@link ReferentielGeoPort} the bundled datasets answer; the
 *  rest comes from the Grist adapter. */
export type ReferentielGeoDatasetPort = Pick<
    ReferentielGeoPort,
    | 'getCommuneCenterPosition'
    | 'getCommuneNom'
    | 'getDepartementContour'
    | 'getCountryContour'
>

export function createReferentielGeoAdapter(): ReferentielGeoDatasetPort {
    return {
        getCommuneCenterPosition(codeCommune) {
            const commune = communes[codeCommune]

            return commune === undefined
                ? undefined
                : { latitude: commune.latitude, longitude: commune.longitude }
        },

        getCommuneNom(codeCommune) {
            return communes[codeCommune]?.nom
        },

        getDepartementContour(codeDepartement) {
            const departement = departements[codeDepartement]

            return departement === undefined
                ? []
                : toPositions(departement.contour)
        },

        getCountryContour(libelle) {
            const country = countryByNom.get(normalise(libelle))

            return country === undefined ? [] : toPositions(country.contour)
        },
    }
}
