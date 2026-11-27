// Regenerates communes.json (INSEE code → centre) from the Grist `INSEE_Commune` CSV export;
// rerun whenever that table changes. Centres come from geo.api.gouv.fr.
//     pnpm generate:referentiels communes --csv <INSEE_Commune.csv> --source "<where it comes from>"

import { readFile, writeFile } from 'node:fs/promises'
import { basename } from 'node:path'

export const CENTRES_SOURCE = 'https://geo.api.gouv.fr/'

// `/communes` omits arrondissements unless `type` asks for them; communes
// déléguées and associées have an endpoint of their own.
const ENDPOINTS = [
    'https://geo.api.gouv.fr/communes?fields=code,type,centre&format=json&geometry=centre&type=commune-actuelle,arrondissement-municipal',
    'https://geo.api.gouv.fr/communes_associees_deleguees?fields=code,type,centre&format=json&geometry=centre',
] as const

const OUTPUT_URL = new URL('./communes.json', import.meta.url)
export const OUTPUT_PATH = 'shared/infrastructure/referentiel-geo/communes.json'

const TYPES_COMMUNE = ['COM', 'ARM', 'COMA', 'COMD'] as const
export type TypeCommune = (typeof TYPES_COMMUNE)[number]

const TYPE_BY_API_TYPE: Record<string, TypeCommune> = {
    'commune-actuelle': 'COM',
    'arrondissement-municipal': 'ARM',
    'commune-associee': 'COMA',
    'commune-deleguee': 'COMD',
}

export type LigneReferentiel = {
    type: TypeCommune
    code: string
    libelle: string
}

export type Centre = {
    latitude: number
    longitude: number
}

/** Keyed by {@link centreKey}. */
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
    /** CSV export of the Grist `INSEE_Commune` table. */
    csvPath: string
    source: string
}

/** A commune déléguée chef-lieu shares its commune nouvelle's code, hence the type. */
function centreKey(type: TypeCommune, code: string): string {
    return `${type}:${code}`
}

/** Grist's CSV export: RFC 4180 quoting, LF or CRLF, optional BOM. */
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

    if (quoted) {
        throw new Error('the référentiel CSV has an unterminated quoted field')
    }

    if (field !== '' || row.length > 0) {
        row.push(field)
        rows.push(row)
    }

    return rows
}

/** `ignorees` are 1-based line numbers, header included, as an editor shows them. */
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

/** Unusable entries are dropped: their commune then gets reported as without a centre. */
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

/** When several rows share a code, the earlier type wins (commune nouvelle over its déléguée). */
const PRIORITY: readonly TypeCommune[] = ['COM', 'ARM', 'COMA', 'COMD']

/** `sansCentre` lists every unplaced row, even when another row gave its code a centre. */
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
        // Sorted for a byte-identical output; integer-like codes are still hoisted first.
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

    // File name only: the full path is local and the output is committed.
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

    // Written last: a failed run leaves the committed dataset untouched.
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
