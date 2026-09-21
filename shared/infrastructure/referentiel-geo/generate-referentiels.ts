// Regenerates the three référentiels géographiques this folder bundles.
//
//     pnpm generate:referentiels              # all three
//     pnpm generate:referentiels communes     # just the one named
//
// Each comes from its own source — geo.api.gouv.fr for the communes, IGN's
// Géoplateforme for the départements, geoBoundaries for the countries — and
// each moves about once a year, so this is run by hand and the results are
// committed.
//
// The three are independent datasets, so a source being down only fails its
// own: the run carries on and reports at the end. Naming one is there because
// the countries take a few minutes — geoBoundaries serves a file per country
// and some are tens of megabytes — which is a long wait when all that moved
// on 1 January was a commune merging with its neighbour.

import process from 'node:process'

import {
    generateCommunes,
    OUTPUT_PATH as COMMUNES_OUTPUT_PATH,
} from './generate-communes.ts'
import {
    generateDepartementsContours,
    OUTPUT_PATH as DEPARTEMENTS_OUTPUT_PATH,
} from './generate-departements-contours.ts'
import {
    generateCountriesContours,
    OUTPUT_PATH as PAYS_OUTPUT_PATH,
} from './generate-countries-contours.ts'

/** Each référentiel, under the name the command line calls it by. */
const REFERENTIELS = {
    communes: {
        output: COMMUNES_OUTPUT_PATH,
        generate: generateCommunes,
    },
    departements: {
        output: DEPARTEMENTS_OUTPUT_PATH,
        generate: generateDepartementsContours,
    },
    pays: {
        output: PAYS_OUTPUT_PATH,
        generate: generateCountriesContours,
    },
} as const

type NomReferentiel = keyof typeof REFERENTIELS

const NOMS = Object.keys(REFERENTIELS) as NomReferentiel[]

function isNomReferentiel(value: string): value is NomReferentiel {
    return NOMS.includes(value as NomReferentiel)
}

/**
 * The référentiels named on the command line, or all of them when none is.
 * Filtered out of `NOMS` rather than read off the arguments, so the run order
 * is the same however they were typed, and a name given twice runs once.
 */
function selection(args: readonly string[]): NomReferentiel[] {
    const unknown = args.filter((arg) => !isNomReferentiel(arg))
    if (unknown.length > 0) {
        throw new Error(
            `unknown référentiel: ${unknown.join(', ')}. ` +
                `Expected any of: ${NOMS.join(', ')}.`
        )
    }

    if (args.length === 0) return NOMS
    return NOMS.filter((nom) => args.includes(nom))
}

async function main(): Promise<void> {
    // pnpm forwards a bare `--` along with the arguments after it, and it is
    // what a hand reaches for out of npm habit. Dropping it keeps both spellings
    // of `pnpm generate:referentiels communes` working.
    const args = process.argv.slice(2).filter((arg) => arg !== '--')
    const noms = selection(args)
    const failed: NomReferentiel[] = []

    for (const [index, nom] of noms.entries()) {
        if (index > 0) console.log('')

        const { output, generate } = REFERENTIELS[nom]
        try {
            await generate()
        } catch (error) {
            failed.push(nom)

            // A stack trace would only point at the fetch/parse plumbing; the
            // message and its `cause` are what tell you whether the API is
            // down, moved, or changed shape.
            console.error(`Could not generate ${output}.`)
            console.error(
                error instanceof Error ? error.message : String(error)
            )
            if (error instanceof Error && error.cause !== undefined) {
                console.error('Caused by:', error.cause)
            }
        }
    }

    if (failed.length > 0) {
        console.error(`\nFailed: ${failed.join(', ')}.`)
        process.exitCode = 1
    }
}

try {
    await main()
} catch (error) {
    // Only the argument check reaches here; a generator that fails is reported
    // above and does not stop the ones after it.
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
}
