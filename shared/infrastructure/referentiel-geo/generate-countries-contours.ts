// Regenerates countries-contours.json (ISO alpha-3 → French name + outline) from geoBoundaries ADM0.
// Upstream "simplified" files are thinned again (13 MB for Canada): `pnpm generate:referentiels pays`

import { writeFile } from 'node:fs/promises'

const SOURCE = 'https://www.geoboundaries.org/'

const INDEX_ENDPOINT =
    'https://www.geoboundaries.org/api/current/gbOpen/ALL/ADM0/'

const OUTPUT_URL = new URL('./countries-contours.json', import.meta.url)
export const OUTPUT_PATH =
    'shared/infrastructure/referentiel-geo/countries-contours.json'

// Degrees (~5 km).
const TOLERANCE = 0.05

// ~10 m at the equator.
const DECIMALS = 4

// Degrees (~1 km): islands smaller than this are dropped. Must stay below Monaco's 2 km.
const MINIMUM_EXTENT = 0.01

// Tolerance is capped at 1/20 of the whole country's bounding box (not each ring's),
// otherwise TOLERANCE flattens small countries such as Monaco.
const MINIMUM_DETAIL = 20

// One file per country, some tens of MB, served from GitHub.
const CONCURRENCY = 8

/** [longitude, latitude]. */
type GeoJsonPoint = [number, number]

/** [latitude, longitude], the order Leaflet reads. */
type Ring = [number, number][]

type IndexEntry = {
    boundaryISO?: string
    boundaryName?: string
    simplifiedGeometryGeoJSON?: string
    gjDownloadURL?: string
}

type GeoJsonGeometry = {
    type?: string
    coordinates?: GeoJsonPoint[][] | GeoJsonPoint[][][]
}

type Country = {
    nom: string
    contour: Ring[]
}

type ContoursFile = {
    _metadata: {
        source: string
        generatedAt: string
        /** Degrees. */
        simplifiedTo: number
    }
    /** Keyed by ISO 3166-1 alpha-3. */
    countries: Record<string, Country>
}

// `Intl.DisplayNames` needs alpha-2; geoBoundaries gives alpha-3. They are paired by English
// name, except for these, which geoBoundaries writes under their full UN name.

const ALPHA_2_BY_ALPHA_3: Readonly<Record<string, string>> = {
    ATA: 'AQ',
    ATG: 'AG',
    BES: 'BQ',
    BIH: 'BA',
    BLM: 'BL',
    BOL: 'BO',
    BRN: 'BN',
    COD: 'CD',
    COG: 'CG',
    CPV: 'CV',
    FLK: 'FK',
    FSM: 'FM',
    IRN: 'IR',
    KNA: 'KN',
    KOR: 'KR',
    LAO: 'LA',
    LCA: 'LC',
    MDA: 'MD',
    MMR: 'MM',
    PRK: 'KP',
    PSE: 'PS',
    RUS: 'RU',
    SHN: 'SH',
    STP: 'ST',
    SYR: 'SY',
    TCA: 'TC',
    TTO: 'TT',
    TUR: 'TR',
    TZA: 'TZ',
    USA: 'US',
    VAT: 'VA',
    VCT: 'VC',
    VEN: 'VE',
    VIR: 'VI',
    WLF: 'WF',
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function normalise(name: string): string {
    return name
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .replace(/[^a-z]/g, '')
}

/** Tries all 676 two-letter codes; non-regions answer with the code itself. */
function alpha2ByEnglishName(): Map<string, string> {
    const english = new Intl.DisplayNames(['en'], { type: 'region' })
    const index = new Map<string, string>()

    for (const first of ALPHABET) {
        for (const second of ALPHABET) {
            const code = first + second
            let name: string | undefined
            try {
                name = english.of(code)
            } catch {
                continue
            }
            if (name === undefined || name === code) continue
            index.set(normalise(name), code)
        }
    }

    return index
}

function frenchNames(entries: readonly IndexEntry[]): Map<string, string> {
    const french = new Intl.DisplayNames(['fr'], { type: 'region' })
    const byEnglishName = alpha2ByEnglishName()
    const names = new Map<string, string>()
    const unnamed: string[] = []

    for (const { boundaryISO, boundaryName } of entries) {
        if (boundaryISO === undefined || boundaryName === undefined) continue

        const alpha2 =
            ALPHA_2_BY_ALPHA_3[boundaryISO] ??
            byEnglishName.get(normalise(boundaryName))

        const nom = alpha2 === undefined ? undefined : french.of(alpha2)

        if (nom === undefined || nom === alpha2) {
            unnamed.push(`${boundaryISO} (${boundaryName})`)
            continue
        }

        names.set(boundaryISO, nom)
    }

    if (unnamed.length > 0) {
        throw new Error(
            `no French name for ${unnamed.length} country/countries: ${unnamed.join(', ')} — add their alpha-2 code to ALPHA_2_BY_ALPHA_3`
        )
    }

    return names
}

function squaredDistanceToSegment(
    point: GeoJsonPoint,
    start: GeoJsonPoint,
    end: GeoJsonPoint
): number {
    let [x, y] = start
    const deltaX = end[0] - x
    const deltaY = end[1] - y

    if (deltaX !== 0 || deltaY !== 0) {
        const position =
            ((point[0] - x) * deltaX + (point[1] - y) * deltaY) /
            (deltaX * deltaX + deltaY * deltaY)

        if (position > 1) {
            x = end[0]
            y = end[1]
        } else if (position > 0) {
            x += deltaX * position
            y += deltaY * position
        }
    }

    return (point[0] - x) ** 2 + (point[1] - y) ** 2
}

/** Douglas-Peucker. */
function simplify(
    ring: readonly GeoJsonPoint[],
    tolerance: number
): GeoJsonPoint[] {
    if (ring.length < 3) return [...ring]

    const kept = new Array<boolean>(ring.length).fill(false)
    kept[0] = true
    kept[ring.length - 1] = true

    const squaredTolerance = tolerance * tolerance
    const segments: [number, number][] = [[0, ring.length - 1]]

    while (segments.length > 0) {
        const segment = segments.pop()
        if (segment === undefined) break

        const [start, end] = segment
        let furthest = -1
        let furthestDistance = 0

        for (let index = start + 1; index < end; index++) {
            const distance = squaredDistanceToSegment(
                ring[index],
                ring[start],
                ring[end]
            )
            if (distance > furthestDistance) {
                furthestDistance = distance
                furthest = index
            }
        }

        if (furthest !== -1 && furthestDistance > squaredTolerance) {
            kept[furthest] = true
            segments.push([start, furthest], [furthest, end])
        }
    }

    return ring.filter((_, index) => kept[index])
}

function isGeoJsonPoint(value: unknown): value is GeoJsonPoint {
    return (
        Array.isArray(value) &&
        value.length === 2 &&
        Number.isFinite(value[0]) &&
        Number.isFinite(value[1])
    )
}

function round(value: number): number {
    const factor = 10 ** DECIMALS
    return Math.round(value * factor) / factor
}

/** Longer side of the bounding box. */
function extent(ring: readonly GeoJsonPoint[]): number {
    let minimumX = Infinity
    let minimumY = Infinity
    let maximumX = -Infinity
    let maximumY = -Infinity

    for (const [x, y] of ring) {
        if (x < minimumX) minimumX = x
        if (x > maximumX) maximumX = x
        if (y < minimumY) minimumY = y
        if (y > maximumY) maximumY = y
    }

    return Math.max(maximumX - minimumX, maximumY - minimumY)
}

function toRing(outline: readonly GeoJsonPoint[]): Ring {
    return outline.map(([longitude, latitude]) => [
        round(latitude),
        round(longitude),
    ])
}

/** Holes (enclaves), rings under MINIMUM_EXTENT and rings flattened below four points are dropped. */
function toContour(geometry: GeoJsonGeometry | undefined): Ring[] {
    const { type, coordinates } = geometry ?? {}
    if (!Array.isArray(coordinates)) return []

    const polygons: unknown[] = type === 'Polygon' ? [coordinates] : coordinates

    const outlines: GeoJsonPoint[][] = []
    for (const polygon of polygons) {
        if (!Array.isArray(polygon)) continue

        const outline: unknown = polygon[0]
        if (!Array.isArray(outline)) continue
        if (!outline.every(isGeoJsonPoint)) continue

        outlines.push(outline)
    }

    if (outlines.length === 0) return []

    const tolerance = Math.min(
        TOLERANCE,
        extent(outlines.flat()) / MINIMUM_DETAIL
    )

    const contour: Ring[] = []
    for (const outline of outlines) {
        // Measured before simplification.
        if (extent(outline) < MINIMUM_EXTENT) continue

        const simplified = simplify(outline, tolerance)
        if (simplified.length < 4) continue

        contour.push(toRing(simplified))
    }

    // Atoll nations (Maldives): every island falls under the minimum, keep the largest.
    if (contour.length === 0) {
        const largest = outlines.reduce((biggest, outline) =>
            extent(outline) > extent(biggest) ? outline : biggest
        )
        const simplified = simplify(largest, extent(largest) / MINIMUM_DETAIL)
        if (simplified.length >= 4) contour.push(toRing(simplified))
    }

    return contour
}

async function fetchJson(url: string): Promise<unknown> {
    let response: Response
    try {
        response = await fetch(url)
    } catch (cause) {
        throw new Error(`could not reach ${url}`, { cause })
    }

    if (!response.ok) {
        throw new Error(
            `${url} answered ${response.status} ${response.statusText}`
        )
    }

    try {
        return await response.json()
    } catch (cause) {
        throw new Error(`${url} did not answer valid JSON`, { cause })
    }
}

async function fetchIndex(): Promise<readonly IndexEntry[]> {
    const payload = await fetchJson(INDEX_ENDPOINT)

    if (!Array.isArray(payload)) {
        throw new Error(
            `expected ${INDEX_ENDPOINT} to answer a list of boundaries, got ${typeof payload}`
        )
    }

    const entries = (payload as unknown[]).filter(
        (entry): entry is IndexEntry =>
            typeof entry === 'object' && entry !== null
    )

    if (entries.length === 0) {
        throw new Error(`${INDEX_ENDPOINT} answered no boundary`)
    }

    return entries
}

/** Usually a FeatureCollection of one feature, but a few countries are a bare Feature. */
function toGeometry(payload: unknown): GeoJsonGeometry | undefined {
    if (typeof payload !== 'object' || payload === null) return undefined

    const { type, features, geometry } = payload as {
        type?: unknown
        features?: unknown
        geometry?: unknown
    }

    if (type === 'FeatureCollection' && Array.isArray(features)) {
        const first: unknown = features[0]
        if (typeof first !== 'object' || first === null) return undefined
        return (first as { geometry?: GeoJsonGeometry }).geometry
    }

    return geometry as GeoJsonGeometry | undefined
}

async function fetchCountry(
    entry: IndexEntry,
    nom: string
): Promise<{ code: string; country: Country } | null> {
    const code = entry.boundaryISO
    if (code === undefined || code === '') return null

    // A few entries publish no simplified file.
    const url = entry.simplifiedGeometryGeoJSON ?? entry.gjDownloadURL
    if (url === undefined || url === '') return null

    const contour = toContour(toGeometry(await fetchJson(url)))
    if (contour.length === 0) return null

    return { code, country: { nom, contour } }
}

async function inBatches<T, R>(
    items: readonly T[],
    work: (item: T) => Promise<R>
): Promise<R[]> {
    const results: R[] = []

    for (let start = 0; start < items.length; start += CONCURRENCY) {
        const batch = items.slice(start, start + CONCURRENCY)
        results.push(...(await Promise.all(batch.map(work))))
    }

    return results
}

/** One country per line, for readable diffs. */
function serialise(file: ContoursFile): string {
    const countries = Object.entries(file.countries)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(
            ([code, country]) =>
                `        ${JSON.stringify(code)}: ${JSON.stringify(country)}`
        )
        .join(',\n')

    const json = [
        '{',
        `    "_metadata": ${JSON.stringify(file._metadata, null, 4).replaceAll('\n', '\n    ')},`,
        '    "countries": {',
        countries,
        '    }',
        '}',
        '',
    ].join('\n')

    // Assembled by hand: validate before it replaces the committed file.
    JSON.parse(json)
    return json
}

export async function generateCountriesContours(): Promise<void> {
    const entries = await fetchIndex()
    const names = frenchNames(entries)

    console.log(`Reading ${entries.length} boundaries from geoBoundaries…`)

    const fetched = await inBatches(entries, async (entry) => {
        const nom = names.get(entry.boundaryISO ?? '')
        if (nom === undefined) return null

        try {
            return await fetchCountry(entry, nom)
        } catch (error) {
            console.warn(
                `Skipped ${entry.boundaryISO}: ${error instanceof Error ? error.message : String(error)}`
            )
            return null
        }
    })

    const countries: Record<string, Country> = {}
    const skipped: string[] = []

    for (const [index, result] of fetched.entries()) {
        if (result === null) {
            skipped.push(entries[index].boundaryISO ?? '(entry without a code)')
            continue
        }
        countries[result.code] = result.country
    }

    if (Object.keys(countries).length === 0) {
        throw new Error(`${INDEX_ENDPOINT} answered no usable country`)
    }

    if (skipped.length > 0) {
        console.warn(
            `Skipped ${skipped.length} country/countries with missing or malformed data: ${skipped.join(', ')}`
        )
    }

    const data: ContoursFile = {
        _metadata: {
            source: SOURCE,
            generatedAt: new Date().toISOString(),
            simplifiedTo: TOLERANCE,
        },
        countries,
    }

    // Written last: a failed run leaves the committed dataset untouched.
    await writeFile(OUTPUT_URL, serialise(data), 'utf8')

    const values = Object.values(countries)
    const points = values.reduce(
        (total, { contour }) =>
            total + contour.reduce((sum, ring) => sum + ring.length, 0),
        0
    )

    console.log(`Generated ${OUTPUT_PATH}`)
    console.log(`Countries: ${values.length.toLocaleString('en-US')}`)
    console.log(`Points: ${points.toLocaleString('en-US')}`)
    console.log(`Source: ${SOURCE}`)
    console.log(`Generated at: ${data._metadata.generatedAt}`)
}
