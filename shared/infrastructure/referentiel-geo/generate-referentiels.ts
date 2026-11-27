// Regenerates the three référentiels géographiques this folder bundles.
//
//     pnpm generate:referentiels --csv <INSEE_Commune.csv> --source "<…>"   # all three
//     pnpm generate:referentiels communes --csv <…> --source "<…>"          # just the one named
//     pnpm generate:referentiels departements pays                          # no CSV needed

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

/** All when none is named; always in `NOMS` order, without duplicates. */
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

/** Refused when the communes do not run, so a typo in the names cannot silently skip the CSV. */
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

    // pnpm runs scripts from the package root; INIT_CWD is where the command was typed.
    const csvPath = resolve(process.env.INIT_CWD ?? process.cwd(), csv)

    return { csvPath, source: source.trim() }
}

async function main(): Promise<void> {
    // pnpm forwards a bare `--`, which would make parseArgs read every option after it as a positional.
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
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
}
