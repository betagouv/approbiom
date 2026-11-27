// Projects the place names out of the 6.3 MB contour datasets into a ~15 KB file.
// Run after regenerating either contour dataset: `pnpm generate:place-names`

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const here = fileURLToPath(new URL('.', import.meta.url))

/**
 * Not `JSON.parse`: it hoists integer-like keys ("971" before "01"), and file
 * order breaks ties between same-length names.
 */
function keysInFileOrder(raw: string, section: string): string[] {
    const from = raw.indexOf(`"${section}":`)
    if (from === -1) throw new Error(`no "${section}" section`)

    // Entries are the only keys whose value is an object.
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
