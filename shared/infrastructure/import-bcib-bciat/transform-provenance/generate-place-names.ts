// Projects the place names out of the contour datasets.
//
//     pnpm generate:place-names
//
// The provenance reader needs 331 names; the contour files that hold them
// weigh 6.3 MB, so shipping those to a widget is out of the question. This
// writes the ~15 KB projection instead. Run it after regenerating either
// contour dataset.

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const here = fileURLToPath(new URL('.', import.meta.url))

/**
 * The keys of one section, in the order the file writes them.
 *
 * `JSON.parse` cannot be used for this: JavaScript hoists integer-like keys, so
 * "971" would come out ahead of "01". The order decides which name wins when
 * two are the same length, so it has to survive.
 */
function keysInFileOrder(raw: string, section: string): string[] {
    const from = raw.indexOf(`"${section}":`)
    if (from === -1) throw new Error(`no "${section}" section`)

    // Entries are the only keys whose value is an object: `nom` holds a string
    // and `contour` an array.
    const entries = raw.slice(from).matchAll(/"([^"]+)":\s*\{/g)

    return [...entries].map(([, key]) => key).slice(1)
}

function project(file: string, section: string): [string, string][] {
    const raw = readFileSync(here + file, 'utf8')
    const parsed = JSON.parse(raw) as Record<
        string,
        Record<string, { nom: string }>
    >

    return keysInFileOrder(raw, section).map((key) => [
        key,
        parsed[section][key].nom,
    ])
}

const departements = project('departements-contours.json', 'departements')
const countries = project('countries-contours.json', 'countries')

if (departements.length !== 101) {
    throw new Error(`expected 101 départements, read ${departements.length}`)
}

writeFileSync(
    here + 'place-names.json',
    JSON.stringify(
        {
            _metadata: {
                source: 'departements-contours.json + countries-contours.json',
                generatedAt: new Date().toISOString(),
            },
            departements,
            countries,
        },
        null,
        2
    ) + '\n'
)
