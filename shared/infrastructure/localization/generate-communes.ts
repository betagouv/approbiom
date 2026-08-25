// Regenerates communes.json — the local INSEE code → geographic centre lookup
// used to place a commune on a map without hitting the network at runtime.
//
//     pnpm generate:communes
//
// The dataset only changes when communes merge or split (a handful per year,
// on 1 January), so this is run by hand and the result is committed.

import { writeFile } from 'node:fs/promises'
import process from 'node:process'

const SOURCE = 'https://geo.api.gouv.fr/'

// `fields` keeps the payload to what we store; `geometry=centre` makes `centre`
// the geometry that gets returned, and `format=json` returns a plain array
// rather than a GeoJSON FeatureCollection.
const ENDPOINT =
    'https://geo.api.gouv.fr/communes?fields=code,nom,centre&format=json&geometry=centre'

const OUTPUT_URL = new URL('./communes.json', import.meta.url)
const OUTPUT_PATH = 'shared/infrastructure/localization/communes.json'

/** One entry of the `GET /communes` array, as documented by geo.api.gouv.fr. */
type ApiCommune = {
    code: string
    nom: string
    centre?: GeoJsonPoint
}

/** GeoJSON orders coordinates [longitude, latitude], not the other way round. */
type GeoJsonPoint = {
    type: 'Point'
    coordinates: [number, number]
}

type Commune = {
    nom: string
    latitude: number
    longitude: number
}

type CommunesFile = {
    _metadata: {
        source: string
        generatedAt: string
    }
    /** Keyed by INSEE code. */
    communes: Record<string, Commune>
}

async function fetchCommunes(): Promise<unknown> {
    let response: Response
    try {
        response = await fetch(ENDPOINT)
    } catch (cause) {
        throw new Error(`could not reach ${ENDPOINT}`, { cause })
    }

    if (!response.ok) {
        throw new Error(
            `${ENDPOINT} answered ${response.status} ${response.statusText}`
        )
    }

    try {
        return await response.json()
    } catch (cause) {
        throw new Error(`${ENDPOINT} did not answer valid JSON`, { cause })
    }
}

/**
 * Returns `null` for an entry we cannot use — an unnamed commune, or one whose
 * centre is missing or not a pair of finite numbers. Those are skipped rather
 * than fatal: a single bad row upstream should not cost us the other 34 000.
 */
function toCommune(entry: unknown): { code: string; commune: Commune } | null {
    if (typeof entry !== 'object' || entry === null) return null

    const { code, nom, centre } = entry as Partial<ApiCommune>
    if (typeof code !== 'string' || code === '') return null
    if (typeof nom !== 'string' || nom === '') return null

    const coordinates = centre?.coordinates
    if (!Array.isArray(coordinates) || coordinates.length !== 2) return null

    const [longitude, latitude] = coordinates
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null

    return { code, commune: { nom, latitude, longitude } }
}

function toCommunesFile(payload: unknown): CommunesFile {
    if (!Array.isArray(payload)) {
        throw new Error(
            `expected ${ENDPOINT} to answer an array of communes, got ${typeof payload}`
        )
    }

    const communes: Record<string, Commune> = {}
    const skipped: string[] = []

    const entries: unknown[] = payload
    for (const entry of entries) {
        const parsed = toCommune(entry)
        if (parsed === null) {
            skipped.push(describe(entry))
            continue
        }
        communes[parsed.code] = parsed.commune
    }

    if (Object.keys(communes).length === 0) {
        throw new Error(`${ENDPOINT} answered no usable commune`)
    }

    if (skipped.length > 0) {
        console.warn(
            `Skipped ${skipped.length} commune(s) with missing or malformed data: ${skipped.slice(0, 10).join(', ')}${skipped.length > 10 ? ', …' : ''}`
        )
    }

    return {
        _metadata: {
            source: SOURCE,
            generatedAt: new Date().toISOString(),
        },
        // Sorted so that regenerating an unchanged dataset gives a byte-identical
        // file, whatever order the API answered in. Codes without a leading zero
        // still land first in the JSON: JavaScript hoists integer-like keys to
        // the front of an object, and `JSON.stringify` follows.
        communes: Object.fromEntries(
            Object.entries(communes).sort(([a], [b]) => a.localeCompare(b))
        ),
    }
}

/** A short label for a rejected entry, so the warning is actionable. */
function describe(entry: unknown): string {
    if (typeof entry === 'object' && entry !== null && 'code' in entry) {
        return String(entry.code)
    }
    return '(entry without a code)'
}

async function main(): Promise<void> {
    const data = toCommunesFile(await fetchCommunes())

    // Nothing is written until the whole payload has been validated, so a
    // failed run always leaves the committed dataset untouched.
    await writeFile(OUTPUT_URL, `${JSON.stringify(data, null, 4)}\n`, 'utf8')

    const count = Object.keys(data.communes).length
    console.log(`Generated ${OUTPUT_PATH}`)
    console.log(`Communes: ${count.toLocaleString('en-US')}`)
    console.log(`Source: ${SOURCE}`)
    console.log(`Generated at: ${data._metadata.generatedAt}`)
}

try {
    await main()
} catch (error) {
    // A stack trace would only point at the fetch/parse plumbing; the message
    // and its `cause` are what tell you whether the API is down, moved, or
    // changed shape.
    console.error(`Could not generate ${OUTPUT_PATH}.`)
    console.error(error instanceof Error ? error.message : String(error))
    if (error instanceof Error && error.cause !== undefined) {
        console.error('Caused by:', error.cause)
    }
    process.exitCode = 1
}
