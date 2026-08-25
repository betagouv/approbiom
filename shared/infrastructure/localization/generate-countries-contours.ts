// Regenerates countries-contours.json — the local ISO 3166-1 alpha-3 → outline
// lookup used to draw a country on a map without hitting the network.
//
//     pnpm generate:countries-contours
//
// geoBoundaries publishes one ADM0 (country) boundary per country under an open
// licence, indexed by the API below. Each entry points at two GeoJSON files: the
// full geometry, and a `simplified` one already generalised for the web. The
// simplified one is what is read here — and then thinned again, because
// "simplified" upstream still means 13 MB for Canada, which is its eight
// thousand islands drawn to a precision no world map can show.
//
// Countries are keyed by `boundaryISO`, the ISO 3166-1 alpha-3 code, and named
// in French: the document names a foreign provenance in French, so the screen
// has to be able to find a country by the name it is written under.

import { writeFile } from 'node:fs/promises'
import process from 'node:process'

const SOURCE = 'https://www.geoboundaries.org/'

const INDEX_ENDPOINT =
    'https://www.geoboundaries.org/api/current/gbOpen/ALL/ADM0/'

const OUTPUT_URL = new URL('./countries-contours.json', import.meta.url)
const OUTPUT_PATH = 'shared/infrastructure/localization/countries-contours.json'

// In degrees, so about 5 km. A country is read at world scale, where a degree
// is a handful of pixels: a point sitting this close to the line its neighbours
// already draw cannot be told apart from it, and there are millions of them.
const TOLERANCE = 0.05

// About 10 m at the equator, which is far finer than the simplification leaves
// meaningful. Keeping more only stores the noise it just removed.
const DECIMALS = 4

// Degrees, so about 1 km. An island whose bounding box is smaller than this is
// under a pixel at the scale its country is drawn at, so it costs points and
// draws nothing. Low enough to let a microstate through: Monaco is 2 km across,
// and a country absent from the map reads as a country with no data.
const MINIMUM_EXTENT = 0.01

// A country is never simplified past a twentieth of its own bounding box,
// whatever TOLERANCE says. Without this the tolerance is measured against a
// scale the small countries are not drawn at: 5 km of slack flattens Monaco to
// a straight line, and a shape under four points is dropped as no shape at all.
//
// Measured over the whole country rather than over each ring: a map showing
// Monaco is zoomed to Monaco, but a map showing Canada is not zoomed to each of
// its eight thousand islands, and giving those the detail their own size asks
// for is how a country costs a hundred thousand points.
const MINIMUM_DETAIL = 20

// geoBoundaries serves each country's geometry as its own file, some of them
// tens of megabytes. Eight at a time keeps the run to a few minutes without
// asking GitHub to serve two hundred large files at once.
const CONCURRENCY = 8

/** GeoJSON orders a point [longitude, latitude], not the other way round. */
type GeoJsonPoint = [number, number]

/** A ring of the outline, [latitude, longitude] — the order Leaflet reads. */
type Ring = [number, number][]

/** One entry of the ADM0 index. Only these four fields are read. */
type IndexEntry = {
    boundaryISO?: string
    boundaryName?: string
    simplifiedGeometryGeoJSON?: string
    gjDownloadURL?: string
}

type GeoJsonGeometry = {
    type?: string
    // Polygon: rings. MultiPolygon: polygons, each a list of rings. In both
    // the first ring of a polygon is its outline, the rest are holes.
    coordinates?: GeoJsonPoint[][] | GeoJsonPoint[][][]
}

type Country = {
    /** The country's name in French, the language the document names it in. */
    nom: string
    contour: Ring[]
}

type ContoursFile = {
    _metadata: {
        source: string
        generatedAt: string
        /** The tolerance the outlines were simplified with, in degrees. */
        simplifiedTo: number
    }
    /** Keyed by ISO 3166-1 alpha-3 code. */
    countries: Record<string, Country>
}

// ---------------------------------------------------------------------------
// Naming
//
// `Intl.DisplayNames` names a région from its alpha-2 code, and geoBoundaries
// identifies a country by its alpha-3 one. Nothing in the platform converts
// between the two, so the pairing is recovered by matching the English name
// both sides know the country by. That works for most of them; the rest are
// the ones geoBoundaries writes under their full UN name ("Russian Federation"
// where CLDR says "Russia"), and they are listed out below.
//
// The run fails if a country is left without a name, so a rename upstream is
// loud rather than a country quietly missing from the map.
// ---------------------------------------------------------------------------

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

/** Accents, case and punctuation dropped, so two spellings of a name meet. */
function normalise(name: string): string {
    return name
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .replace(/[^a-z]/g, '')
}

/**
 * Every alpha-2 code CLDR names, indexed by its normalised English name. Built
 * by asking for all 676 two-letter combinations: the ones that are not regions
 * answer with the code itself, which is how they are told apart.
 */
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

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

/**
 * How far a point sits from the segment its neighbours draw, squared — squared
 * because only the comparison matters and a square root per point is a square
 * root millions of times.
 */
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

/**
 * Douglas-Peucker: keep the two ends, keep the point furthest from the line
 * between them if it is further than the tolerance, and ask the same of the
 * two halves it cuts the ring into.
 *
 * Written with an explicit stack rather than recursion because a coastline is
 * tens of thousands of points and the recursion is only shallow on average.
 */
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

/** The longer side of a ring's bounding box, in degrees. */
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

/** A simplified outline, rounded and flipped to the order Leaflet reads. */
function toRing(outline: readonly GeoJsonPoint[]): Ring {
    return outline.map(([longitude, latitude]) => [
        round(latitude),
        round(longitude),
    ])
}

/**
 * The outlines of one geometry, simplified and flipped to [latitude, longitude].
 *
 * Holes are dropped: a hole in a country is an enclave of a neighbour, and the
 * map this feeds draws an outline rather than a surface. Rings that stay under
 * MINIMUM_EXTENT, or that the tolerance leaves with fewer than four points, are
 * dropped too — an islet flattened to a line is no longer a shape.
 */
function toContour(geometry: GeoJsonGeometry | undefined): Ring[] {
    const { type, coordinates } = geometry ?? {}
    if (!Array.isArray(coordinates)) return []

    // A Polygon is a list of rings, a MultiPolygon a list of those. Reading
    // both as a list of polygons is what lets one function answer for either.
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
        // Measured before simplification: the tolerance pulls a ring's points
        // together without saying how big the ring was.
        if (extent(outline) < MINIMUM_EXTENT) continue

        const simplified = simplify(outline, tolerance)
        if (simplified.length < 4) continue

        contour.push(toRing(simplified))
    }

    // An atoll nation is a wide country made only of narrow islands: its span
    // buys it a coarse tolerance, and every one of its islands then falls under
    // the minimum. Keeping the largest of them, drawn to its own size, is what
    // stops the Maldives from having no outline at all.
    if (contour.length === 0) {
        const largest = outlines.reduce((biggest, outline) =>
            extent(outline) > extent(biggest) ? outline : biggest
        )
        const simplified = simplify(largest, extent(largest) / MINIMUM_DETAIL)
        if (simplified.length >= 4) contour.push(toRing(simplified))
    }

    return contour
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

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

/**
 * The geometry of one country. geoBoundaries wraps it in a FeatureCollection of
 * a single ADM0 feature, but serves a bare Feature for a few of them, so both
 * are read.
 */
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

/**
 * Returns `null` for a country nothing usable came back for. Those are skipped
 * rather than fatal: one boundary file missing upstream should not cost us the
 * other two hundred.
 */
async function fetchCountry(
    entry: IndexEntry,
    nom: string
): Promise<{ code: string; country: Country } | null> {
    const code = entry.boundaryISO
    if (code === undefined || code === '') return null

    // The simplified geometry is what this is for; the full one is the fallback
    // for the handful of entries that do not publish a simplified file.
    const url = entry.simplifiedGeometryGeoJSON ?? entry.gjDownloadURL
    if (url === undefined || url === '') return null

    const contour = toContour(toGeometry(await fetchJson(url)))
    if (contour.length === 0) return null

    return { code, country: { nom, contour } }
}

/** Runs `work` over `items`, `CONCURRENCY` of them in flight at a time. */
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

/**
 * `JSON.stringify(file, null, 4)` would put each of the hundreds of thousands
 * of coordinates on a line of its own, which is a file no one can read a diff
 * of. One country per line keeps it legible where it matters — you see which of
 * them moved — and small enough to bundle.
 */
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

    // Assembled by hand, so it is parsed back before it is allowed to replace
    // the committed file.
    JSON.parse(json)
    return json
}

async function main(): Promise<void> {
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

    // Nothing is written until the whole payload has been validated, so a
    // failed run always leaves the committed dataset untouched.
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
