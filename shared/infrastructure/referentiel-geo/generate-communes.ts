// Regenerates communes.json — the local INSEE code → geographic centre lookup
// used to place a commune on a map without hitting the network at runtime.
//
//     pnpm generate:referentiels communes --csv <INSEE_Commune.csv> --source "<where it comes from>"
//
// The communes it holds are the ones the Grist document knows: its
// `INSEE_Commune` table, exported as CSV, is the référentiel. Only the centres
// come from geo.api.gouv.fr. Keeping the two in step is what lets a commune a
// document names land on the map, so this is rerun by hand whenever that table
// is updated, and the result is committed.

import { readFile, writeFile } from 'node:fs/promises'
import { basename } from 'node:path'

export const CENTRES_SOURCE = 'https://geo.api.gouv.fr/'

// `fields` keeps the payload to what we read; `geometry=centre` makes `centre`
// the geometry that gets returned, and `format=json` returns a plain array
// rather than a GeoJSON FeatureCollection. `/communes` answers the communes
// actuelles only unless `type` asks for the arrondissements as well; the
// communes déléguées and associées are served by an endpoint of their own.
const ENDPOINTS = [
    'https://geo.api.gouv.fr/communes?fields=code,type,centre&format=json&geometry=centre&type=commune-actuelle,arrondissement-municipal',
    'https://geo.api.gouv.fr/communes_associees_deleguees?fields=code,type,centre&format=json&geometry=centre',
] as const

const OUTPUT_URL = new URL('./communes.json', import.meta.url)
export const OUTPUT_PATH = 'shared/infrastructure/referentiel-geo/communes.json'

/** The TYPECOM values of the COG, as the Grist table holds them. */
const TYPES_COMMUNE = ['COM', 'ARM', 'COMA', 'COMD'] as const
export type TypeCommune = (typeof TYPES_COMMUNE)[number]

/** How geo.api.gouv.fr spells each TYPECOM in its `type` field. */
const TYPE_BY_API_TYPE: Record<string, TypeCommune> = {
    'commune-actuelle': 'COM',
    'arrondissement-municipal': 'ARM',
    'commune-associee': 'COMA',
    'commune-deleguee': 'COMD',
}

/** One row of the référentiel that names a commune. */
export type LigneReferentiel = {
    type: TypeCommune
    code: string
    libelle: string
}

export type Centre = {
    latitude: number
    longitude: number
}

/** Keyed by {@link centreKey}: a code alone is not enough, see there. */
export type Centres = ReadonlyMap<string, Centre>

type Commune = {
    nom: string
    latitude: number
    longitude: number
}

export type CommunesFile = {
    _metadata: {
        _comment: string
        generatedAt: string
        referentiel: {
            fichier: string
            source: string
        }
        centresSource: string
    }
    /** Keyed by INSEE code. */
    communes: Record<string, Commune>
}

export type GenerateCommunesOptions = {
    /** The CSV export of the Grist `INSEE_Commune` table. */
    csvPath: string
    /** Free text saying where that CSV comes from, copied into the output. */
    source: string
}

/**
 * A commune déléguée chef-lieu carries the code of the commune nouvelle it
 * belongs to, so one code can name two places: the centre is looked up by type
 * and code together.
 */
function centreKey(type: TypeCommune, code: string): string {
    return `${type}:${code}`
}

/**
 * Splits a CSV the way Grist exports it: comma-separated, a field quoted when
 * it holds a comma, quote or line break, a quote inside one doubled. Line
 * endings may be LF or CRLF, and a leading byte-order mark is dropped.
 */
export function parseCsv(text: string): string[][] {
    const rows: string[][] = []
    let row: string[] = []
    let field = ''
    let quoted = false

    const input = text.startsWith('\uFEFF') ? text.slice(1) : text

    for (let index = 0; index < input.length; index++) {
        const char = input[index]

        if (quoted) {
            if (char !== '"') {
                field += char
            } else if (input[index + 1] === '"') {
                field += '"'
                index++
            } else {
                quoted = false
            }
            continue
        }

        if (char === '"') {
            quoted = true
        } else if (char === ',') {
            row.push(field)
            field = ''
        } else if (char === '\n' || char === '\r') {
            if (char === '\r' && input[index + 1] === '\n') index++
            row.push(field)
            rows.push(row)
            row = []
            field = ''
        } else {
            field += char
        }
    }

    // Left open, a quote would have swallowed every row after it into one
    // field, and those communes would go missing without a word.
    if (quoted) {
        throw new Error('the référentiel CSV has an unterminated quoted field')
    }

    // The last line may or may not end with a line break.
    if (field !== '' || row.length > 0) {
        row.push(field)
        rows.push(row)
    }

    return rows
}

/**
 * The communes the référentiel names, and the line numbers (1-based, header
 * included, as an editor shows them) of the rows that name none: a row with
 * no code, no libellé or a TYPECOM the COG does not define.
 */
export function parseReferentiel(text: string): {
    lignes: LigneReferentiel[]
    ignorees: number[]
} {
    const [header, ...rows] = parseCsv(text)
    if (header === undefined) {
        throw new Error('the référentiel CSV is empty')
    }

    const column = (name: string): number => {
        const index = header.indexOf(name)
        if (index === -1) {
            throw new Error(
                `the référentiel CSV has no ${name} column (found: ${header.join(', ')})`
            )
        }
        return index
    }
    const typeColumn = column('TYPECOM')
    const codeColumn = column('COM')
    const libelleColumn = column('LIBELLE')

    const lignes: LigneReferentiel[] = []
    const ignorees: number[] = []

    for (const [index, row] of rows.entries()) {
        // A blank line, typically the one an editor leaves at the end.
        if (row.every((field) => field.trim() === '')) continue

        const type = row[typeColumn]?.trim() ?? ''
        const code = row[codeColumn]?.trim() ?? ''
        const libelle = row[libelleColumn]?.trim() ?? ''

        if (!isTypeCommune(type) || code === '' || libelle === '') {
            ignorees.push(index + 2)
            continue
        }

        lignes.push({ type, code, libelle })
    }

    return { lignes, ignorees }
}

function isTypeCommune(value: string): value is TypeCommune {
    return TYPES_COMMUNE.includes(value as TypeCommune)
}

/**
 * Indexes what geo.api.gouv.fr answered. An entry with no usable code, type
 * or centre is left out: the commune it stood for then shows up among the ones
 * without a centre, which is where it is actionable.
 */
export function toCentres(payloads: readonly unknown[]): Centres {
    const centres = new Map<string, Centre>()

    for (const payload of payloads) {
        if (!Array.isArray(payload)) {
            throw new Error(
                `expected geo.api.gouv.fr to answer an array of communes, got ${typeof payload}`
            )
        }

        const entries: unknown[] = payload
        for (const entry of entries) {
            if (typeof entry !== 'object' || entry === null) continue

            const { code, type, centre } = entry as {
                code?: unknown
                type?: unknown
                centre?: { coordinates?: unknown }
            }
            if (typeof code !== 'string' || typeof type !== 'string') continue

            const typeCommune = TYPE_BY_API_TYPE[type]
            if (typeCommune === undefined) continue

            // GeoJSON orders coordinates [longitude, latitude].
            const coordinates = centre?.coordinates
            if (!Array.isArray(coordinates) || coordinates.length !== 2)
                continue
            const [longitude, latitude] = coordinates as unknown[]
            if (
                typeof latitude !== 'number' ||
                typeof longitude !== 'number' ||
                !Number.isFinite(latitude) ||
                !Number.isFinite(longitude)
            )
                continue

            centres.set(centreKey(typeCommune, code), { latitude, longitude })
        }
    }

    return centres
}

/**
 * Where a code is carried by several rows — a commune nouvelle and its commune
 * déléguée chef-lieu — the entry is the commune's own, as a document naming
 * that code means the commune nouvelle. Earlier in this list wins.
 */
const PRIORITY: readonly TypeCommune[] = ['COM', 'ARM', 'COMA', 'COMD']

/**
 * The file to write, and the rows no centre was found for. Every such row is
 * reported, even when another row with the same code gave that code a centre:
 * each is a commune of the référentiel the API does not place.
 */
export function buildCommunesFile({
    lignes,
    centres,
    referentiel,
    generatedAt,
}: {
    lignes: readonly LigneReferentiel[]
    centres: Centres
    referentiel: { fichier: string; source: string }
    generatedAt: Date
}): { file: CommunesFile; sansCentre: LigneReferentiel[] } {
    const sansCentre: LigneReferentiel[] = []
    const chosen = new Map<
        string,
        { ligne: LigneReferentiel; centre: Centre }
    >()

    for (const ligne of lignes) {
        const centre = centres.get(centreKey(ligne.type, ligne.code))
        if (centre === undefined) {
            sansCentre.push(ligne)
            continue
        }

        const current = chosen.get(ligne.code)
        if (
            current === undefined ||
            PRIORITY.indexOf(ligne.type) < PRIORITY.indexOf(current.ligne.type)
        ) {
            chosen.set(ligne.code, { ligne, centre })
        }
    }

    const communes: Record<string, Commune> = Object.fromEntries(
        // Sorted so that regenerating an unchanged référentiel gives a
        // byte-identical `communes`, whatever order the rows came in. Codes
        // without a leading zero still land first in the JSON: JavaScript
        // hoists integer-like keys to the front of an object, and
        // `JSON.stringify` follows.
        [...chosen.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([code, { ligne, centre }]) => [
                code,
                {
                    nom: ligne.libelle,
                    latitude: centre.latitude,
                    longitude: centre.longitude,
                },
            ])
    )

    const timestamp = generatedAt.toISOString()

    return {
        file: {
            // JSON has no comments: this is the closest thing, and it is
            // the first thing anyone opening the file reads.
            _metadata: {
                _comment:
                    `Généré le ${timestamp} par \`pnpm generate:referentiels communes\` ` +
                    `à partir du référentiel ${referentiel.fichier} (source : ${referentiel.source}). ` +
                    `Centres des communes : ${CENTRES_SOURCE}`,
                generatedAt: timestamp,
                referentiel,
                centresSource: CENTRES_SOURCE,
            },
            communes,
        },
        sansCentre,
    }
}

async function fetchJson(endpoint: string): Promise<unknown> {
    let response: Response
    try {
        response = await fetch(endpoint)
    } catch (cause) {
        throw new Error(`could not reach ${endpoint}`, { cause })
    }

    if (!response.ok) {
        throw new Error(
            `${endpoint} answered ${response.status} ${response.statusText}`
        )
    }

    try {
        return await response.json()
    } catch (cause) {
        throw new Error(`${endpoint} did not answer valid JSON`, { cause })
    }
}

export async function generateCommunes({
    csvPath,
    source,
}: GenerateCommunesOptions): Promise<void> {
    let text: string
    try {
        text = await readFile(csvPath, 'utf8')
    } catch (cause) {
        throw new Error(`could not read the référentiel ${csvPath}`, { cause })
    }

    const { lignes, ignorees } = parseReferentiel(text)
    if (ignorees.length > 0) {
        console.warn(
            `Ignored ${ignorees.length} row(s) of the référentiel naming no commune (line ${ignorees.join(', ')}).`
        )
    }
    if (lignes.length === 0) {
        throw new Error(`the référentiel ${csvPath} names no commune`)
    }

    const centres = toCentres(await Promise.all(ENDPOINTS.map(fetchJson)))
    if (centres.size === 0) {
        throw new Error(`${CENTRES_SOURCE} answered no usable centre`)
    }

    // Only the file name goes into the output: the full path is the local
    // machine's, and the file is committed.
    const fichier = basename(csvPath)
    const { file, sansCentre } = buildCommunesFile({
        lignes,
        centres,
        referentiel: { fichier, source },
        generatedAt: new Date(),
    })

    if (sansCentre.length > 0) {
        console.warn(
            `No centre found on ${CENTRES_SOURCE} for ${sansCentre.length} commune(s) of the référentiel:`
        )
        for (const { type, code, libelle } of sansCentre) {
            console.warn(`  ${type.padEnd(4)} ${code}  ${libelle}`)
        }
    }

    // Nothing is written until the whole référentiel has been matched, so a
    // failed run always leaves the committed dataset untouched.
    await writeFile(OUTPUT_URL, `${JSON.stringify(file, null, 4)}\n`, 'utf8')

    const count = Object.keys(file.communes).length
    console.log(`Generated ${OUTPUT_PATH}`)
    console.log(
        `Communes: ${count.toLocaleString('en-US')} codes from ${lignes.length.toLocaleString('en-US')} rows of ${fichier}`
    )
    console.log(
        sansCentre.length === 0
            ? 'Every commune of the référentiel has a centre.'
            : `Communes without a centre: ${sansCentre.length} (listed above).`
    )
    console.log(`Référentiel source: ${source}`)
    console.log(`Centres: ${CENTRES_SOURCE}`)
    console.log(`Generated at: ${file._metadata.generatedAt}`)
}
