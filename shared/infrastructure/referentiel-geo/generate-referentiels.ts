// Regenerates the three référentiels géographiques this folder bundles.
//
//     pnpm generate:referentiels --csv <INSEE_Commune.csv> --source "<…>"   # all three
//     pnpm generate:referentiels communes --csv <…> --source "<…>"          # just the one named
//     pnpm generate:referentiels departements pays                          # no CSV needed
//
// Each comes from its own source — the Grist document's INSEE_Commune table
// (placed with geo.api.gouv.fr) for the communes, IGN's Géoplateforme for the
// départements, geoBoundaries for the countries — and each moves about once a
// year, so this is run by hand and the results are committed.
//
// The three are independent datasets, so a source being down only fails its
// own: the run carries on and reports at the end. Naming one is there because
// the countries take a few minutes — geoBoundaries serves a file per country
// and some are tens of megabytes — which is a long wait when all that moved
// on 1 January was a commune merging with its neighbour.

import { resolve } from 'node:path'
import process from 'node:process'
import { parseArgs } from 'node:util'

import {
    generateCommunes,
    OUTPUT_PATH as COMMUNES_OUTPUT_PATH,
    type GenerateCommunesOptions,
} from './generate-communes.ts'
import {
    generateDepartementsContours,
    OUTPUT_PATH as DEPARTEMENTS_OUTPUT_PATH,
} from './generate-departements-contours.ts'
import {
    generateCountriesContours,
    OUTPUT_PATH as PAYS_OUTPUT_PATH,
} from './generate-countries-contours.ts'

/**
 * Each référentiel, under the name the command line calls it by. Only the
 * communes read the options; `communesOptions` has made sure they are there
 * whenever the communes run.
 */
const REFERENTIELS: Record<
    'communes' | 'departements' | 'pays',
    {
        output: string
        generate: (
            options: GenerateCommunesOptions | undefined
        ) => Promise<void>
    }
> = {
    communes: {
        output: COMMUNES_OUTPUT_PATH,
        generate: (options) => {
            if (options === undefined) throw new Error('missing --csv')
            return generateCommunes(options)
        },
    },
    departements: {
        output: DEPARTEMENTS_OUTPUT_PATH,
        generate: () => generateDepartementsContours(),
    },
    pays: {
        output: PAYS_OUTPUT_PATH,
        generate: () => generateCountriesContours(),
    },
}

type NomReferentiel = keyof typeof REFERENTIELS

const NOMS = Object.keys(REFERENTIELS) as NomReferentiel[]

const USAGE =
    'Usage: pnpm generate:referentiels [communes] [departements] [pays] ' +
    '[--csv <INSEE_Commune.csv> --source "<where the CSV comes from>"]'

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

/**
 * What the communes need: the Grist référentiel and where it comes from. Both
 * are required when the communes run, and refused when they do not, so that a
 * typo in the names cannot silently skip the CSV it was given.
 */
function communesOptions(
    noms: readonly NomReferentiel[],
    csv: string | undefined,
    source: string | undefined
): GenerateCommunesOptions | undefined {
    if (!noms.includes('communes')) {
        if (csv !== undefined || source !== undefined) {
            throw new Error(
                `--csv and --source are for the communes only, which this run leaves out.\n${USAGE}`
            )
        }
        return undefined
    }

    if (csv === undefined || csv.trim() === '') {
        throw new Error(
            `the communes need the Grist INSEE_Commune table, exported as CSV: --csv <file>.\n${USAGE}`
        )
    }
    if (source === undefined || source.trim() === '') {
        throw new Error(
            `the communes need to say where that CSV comes from: --source "<…>".\n${USAGE}`
        )
    }

    // pnpm runs a script from the package root; INIT_CWD is where it was
    // typed, which is what a relative path was written against.
    const csvPath = resolve(process.env.INIT_CWD ?? process.cwd(), csv)

    return { csvPath, source: source.trim() }
}

async function main(): Promise<void> {
    // pnpm forwards a bare `--` along with the arguments after it, and it is
    // what a hand reaches for out of npm habit. Dropping it keeps both spellings
    // of `pnpm generate:referentiels communes` working — and keeps parseArgs
    // from reading every option after it as a positional.
    const { values, positionals } = parseArgs({
        args: process.argv.slice(2).filter((arg) => arg !== '--'),
        allowPositionals: true,
        options: {
            csv: { type: 'string' },
            source: { type: 'string' },
        },
    })

    const noms = selection(positionals)
    const options = communesOptions(noms, values.csv, values.source)
    const failed: NomReferentiel[] = []

    for (const [index, nom] of noms.entries()) {
        if (index > 0) console.log('')

        const { output, generate } = REFERENTIELS[nom]
        try {
            await generate(options)
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
    } else {
        console.log(`\nDone: ${noms.join(', ')}.`)
    }
}

try {
    await main()
} catch (error) {
    // Only the argument checks reach here; a generator that fails is reported
    // above and does not stop the ones after it.
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
}
