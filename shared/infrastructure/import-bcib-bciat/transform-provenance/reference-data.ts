import placeNames from '@shared/infrastructure/import-bcib-bciat/transform-provenance/place-names.json'
import {
    DEPARTEMENT_FRANCAIS,
    PAYS_ETRANGER,
    type Provenance,
} from '@shared/core/domain/value-objects/provenance'

/** France itself and overseas territories already covered by the département dataset. */
const NOT_A_FOREIGN_COUNTRY = new Set([
    'FRA',
    'GLP',
    'MTQ',
    'GUF',
    'REU',
    'MYT',
    'SPM',
    'BLM',
    'MAF',
    'PYF',
    'NCL',
    'WLF',
    'ATF',
])

export type NamedPlace = {
    /** Normalized. */
    name: string
    provenance: Provenance
    pattern: RegExp
}

export type ReferenceData = {
    departements: Map<string, string>
    /**
     * Longest first, so "haute marne" is claimed before "marne"; ties: département
     * before country, then dataset order.
     */
    names: readonly NamedPlace[]
}

/** Unaccented, lowercase, keeping only letters, digits, `%` and decimal points. */
export function normalize(text: string): string {
    // Before stripping commas: "33,5%" would otherwise become "33 5%", read as "5%".
    const withDecimals = text.replace(/(\d+)[.,](\d+)(\s*%)/g, '$1.$2$3')

    const withoutAccents = withDecimals.normalize('NFD').replace(/\p{M}/gu, '')

    const kept = withoutAccents.toLowerCase().replace(/[^a-z0-9%.]/g, ' ')

    const withoutStrayDots = kept.replace(/(?<![0-9])\.|\.(?![0-9])/g, ' ')

    return withoutStrayDots.split(/\s+/).filter(Boolean).join(' ')
}

/** Letters either side disqualify a match, digits do not: "Vosges88" matches. */
function namePattern(name: string): RegExp {
    const escaped = name
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/(?<=[a-z]{4})s(?![a-z])/g, 's?')

    return new RegExp(`(?<![a-z])${escaped}(?![a-z])`, 'g')
}

type Candidate = {
    name: string
    provenance: Provenance
    fromDepartement: boolean
}

export function buildReferenceData(
    departements: readonly (readonly [string, string])[],
    countries: readonly (readonly [string, string])[]
): ReferenceData {
    const asDepartement: Candidate[] = departements.map(([code, nom]) => ({
        name: normalize(nom),
        provenance: { source: DEPARTEMENT_FRANCAIS, code },
        fromDepartement: true,
    }))

    const asCountry: Candidate[] = countries
        .filter(([iso3]) => !NOT_A_FOREIGN_COUNTRY.has(iso3))
        .map(([, libelle]) => ({
            name: normalize(libelle),
            provenance: { source: PAYS_ETRANGER, libelle },
            fromDepartement: false,
        }))

    const names = [...asDepartement, ...asCountry]
        .sort(
            (a, b) =>
                b.name.length - a.name.length ||
                Number(b.fromDepartement) - Number(a.fromDepartement)
        )
        .map(({ name, provenance }) => ({
            name,
            provenance,
            pattern: namePattern(name),
        }))

    return { departements: new Map(departements), names }
}

let cached: ReferenceData | undefined

export function loadReferenceData(): ReferenceData {
    cached ??= buildReferenceData(
        placeNames.departements as [string, string][],
        placeNames.countries as [string, string][]
    )

    return cached
}
