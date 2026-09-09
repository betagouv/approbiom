import placeNames from '@shared/infrastructure/import-bcib-bciat/transform-provenance/place-names.json'
import {
    DEPARTEMENT_FRANCAIS,
    PAYS_ETRANGER,
    type Provenance,
} from '@shared/core/domain/value-objects/provenance'

/**
 * Places that answer to a French département rather than to a foreign country:
 * the overseas ones are already in the département dataset, and France itself
 * is never a provenance.
 */
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
    /** The normalized name, which is what the text is searched for. */
    name: string
    provenance: Provenance
    /** Precompiled once: the search runs this over every cell. */
    pattern: RegExp
}

export type ReferenceData = {
    /** Code to name, for deciding whether a number is a real département. */
    departements: Map<string, string>
    /**
     * Every place that can be named in words, longest name first.
     *
     * The order is what makes "haute marne" win over "marne": names are claimed
     * greedily, so a longer one must get its chance first. A département wins a
     * tie against a country, and anything still tied keeps the dataset's order.
     */
    names: readonly NamedPlace[]
}

/**
 * The text as the reader searches it: unaccented, lowercase, and stripped of
 * everything that is not a letter, a digit, a percent sign or a decimal point.
 */
export function normalize(text: string): string {
    // Decimal percentages first, while the comma is still there to tell them
    // apart: without this "33,5%" would become "33 5%", which reads as "5%".
    const withDecimals = text.replace(/(\d+)[.,](\d+)(\s*%)/g, '$1.$2$3')

    const withoutAccents = withDecimals.normalize('NFD').replace(/\p{M}/gu, '')

    const kept = withoutAccents.toLowerCase().replace(/[^a-z0-9%.]/g, ' ')

    // A dot only ever meant something between two digits.
    const withoutStrayDots = kept.replace(/(?<![0-9])\.|\.(?![0-9])/g, ' ')

    return withoutStrayDots.split(/\s+/).filter(Boolean).join(' ')
}

/**
 * A name is only a mention when it stands on its own — letters either side
 * disqualify it, digits do not, so "Vosges88" names the Vosges twice.
 */
function namePattern(name: string): RegExp {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    return new RegExp(`(?<![a-z])${escaped}(?![a-z])`, 'g')
}

/** A place before the index is ordered; the tier breaks ties. */
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
            // The label keeps its capitals and accents; only the index key is
            // normalized.
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

/** The bundled référentiel, built once. */
export function loadReferenceData(): ReferenceData {
    cached ??= buildReferenceData(
        placeNames.departements as [string, string][],
        placeNames.countries as [string, string][]
    )

    return cached
}
