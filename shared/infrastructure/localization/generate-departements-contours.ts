// Regenerates departements-contours.json — the local département code → outline
// lookup used to draw a département on a map without hitting the network.
//
//     pnpm generate:departements-contours
//
// geo.api.gouv.fr, which the communes come from, serves geometry for communes
// only: `contour` on /departements answers nothing. The outlines come from the
// Géoplateforme instead — IGN's Admin Express COG Carto, the same référentiel,
// published as a WFS.

import { writeFile } from 'node:fs/promises'
import process from 'node:process'

const SOURCE = 'https://data.geopf.fr/'

// `COG-CARTO` is the edition IGN generalises for map-making, and `COUNT` only
// has to clear the 101 départements the layer holds — the response is checked
// against `numberMatched` below rather than paged through.
const ENDPOINT =
    'https://data.geopf.fr/wfs/ows?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0&TYPENAMES=ADMINEXPRESS-COG-CARTO.LATEST:departement&OUTPUTFORMAT=application/json&SRSNAME=EPSG:4326&COUNT=200'

const OUTPUT_URL = new URL('./departements-contours.json', import.meta.url)
const OUTPUT_PATH =
    'shared/infrastructure/localization/departements-contours.json'

// In degrees, so about 100 m. IGN draws the coastline to the metre, which is
// 20 MB of JSON no map at département scale can show — a point that sits this
// close to the line its neighbours already draw is dropped.
const TOLERANCE = 0.001

// Metres, near enough, once the outline is simplified. Keeping more decimals
// only stores the noise the simplification just removed.
const DECIMALS = 5

/** GeoJSON orders a point [longitude, latitude], not the other way round. */
type GeoJsonPoint = [number, number]

/** One feature of the WFS FeatureCollection. */
type ApiFeature = {
    properties?: {
        code_insee?: string
        nom_officiel?: string
    }
    geometry?: {
        type?: string
        // Polygon: rings. MultiPolygon: polygons, each a list of rings. In both
        // the first ring of a polygon is its outline, the rest are holes.
        coordinates?: GeoJsonPoint[][] | GeoJsonPoint[][][]
    }
}

/** A ring of the outline, [latitude, longitude] — the order Leaflet reads. */
type Ring = [number, number][]

type Departement = {
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
    /** Keyed by département code. */
    departements: Record<string, Departement>
}

async function fetchDepartements(): Promise<unknown> {
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
 * How far a point sits from the segment its neighbours draw, squared — squared
 * because only the comparison matters and a square root per point is a square
 * root 800 000 times.
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
function simplify(ring: readonly GeoJsonPoint[]): GeoJsonPoint[] {
    if (ring.length < 3) return [...ring]

    const kept = new Array<boolean>(ring.length).fill(false)
    kept[0] = true
    kept[ring.length - 1] = true

    const squaredTolerance = TOLERANCE * TOLERANCE
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

/**
 * The outlines of one geometry, simplified and flipped to [latitude, longitude].
 *
 * Holes are dropped: the fourteen a département has are enclaves of a
 * neighbour, and the map this feeds draws an outline rather than a surface.
 * Rings left with fewer than four points are dropped too — an islet the
 * tolerance has flattened is no longer a shape.
 */
function toContour(geometry: ApiFeature['geometry']): Ring[] {
    const { type, coordinates } = geometry ?? {}
    if (!Array.isArray(coordinates)) return []

    // A Polygon is a list of rings, a MultiPolygon a list of those. Reading
    // both as a list of polygons is what lets one function answer for either.
    const polygons: unknown[] = type === 'Polygon' ? [coordinates] : coordinates

    const contour: Ring[] = []
    for (const polygon of polygons) {
        if (!Array.isArray(polygon)) continue

        const outline: unknown = polygon[0]
        if (!Array.isArray(outline)) continue
        if (!outline.every(isGeoJsonPoint)) continue

        const simplified = simplify(outline)
        if (simplified.length < 4) continue

        contour.push(
            simplified.map(([longitude, latitude]) => [
                round(latitude),
                round(longitude),
            ])
        )
    }

    return contour
}

/**
 * Returns `null` for a feature we cannot use — one without a code or a name, or
 * one whose outline nothing survives of. Those are skipped rather than fatal: a
 * single bad feature upstream should not cost us the other hundred.
 */
function toDepartement(
    feature: unknown
): { code: string; departement: Departement } | null {
    if (typeof feature !== 'object' || feature === null) return null

    const { properties, geometry } = feature as ApiFeature
    const code = properties?.code_insee
    const nom = properties?.nom_officiel
    if (typeof code !== 'string' || code === '') return null
    if (typeof nom !== 'string' || nom === '') return null

    const contour = toContour(geometry)
    if (contour.length === 0) return null

    return { code, departement: { nom, contour } }
}

function toContoursFile(payload: unknown): ContoursFile {
    if (typeof payload !== 'object' || payload === null) {
        throw new Error(
            `expected ${ENDPOINT} to answer a FeatureCollection, got ${typeof payload}`
        )
    }

    const { features, numberMatched } = payload as {
        features?: unknown
        numberMatched?: unknown
    }
    if (!Array.isArray(features)) {
        throw new Error(`${ENDPOINT} answered a collection without features`)
    }

    // The WFS pages silently: asking for fewer features than it holds answers
    // a partial France without saying so.
    if (
        typeof numberMatched === 'number' &&
        numberMatched > (features as unknown[]).length
    ) {
        throw new Error(
            `${ENDPOINT} holds ${numberMatched} départements but answered ${(features as unknown[]).length} — raise COUNT`
        )
    }

    const departements: Record<string, Departement> = {}
    const skipped: string[] = []

    for (const feature of features as unknown[]) {
        const parsed = toDepartement(feature)
        if (parsed === null) {
            skipped.push(describe(feature))
            continue
        }
        departements[parsed.code] = parsed.departement
    }

    if (Object.keys(departements).length === 0) {
        throw new Error(`${ENDPOINT} answered no usable département`)
    }

    if (skipped.length > 0) {
        console.warn(
            `Skipped ${skipped.length} département(s) with missing or malformed data: ${skipped.join(', ')}`
        )
    }

    return {
        _metadata: {
            source: SOURCE,
            generatedAt: new Date().toISOString(),
            simplifiedTo: TOLERANCE,
        },
        departements,
    }
}

/** A short label for a rejected feature, so the warning is actionable. */
function describe(feature: unknown): string {
    if (typeof feature === 'object' && feature !== null) {
        const { properties } = feature as ApiFeature
        if (properties?.code_insee !== undefined) return properties.code_insee
    }
    return '(feature without a code)'
}

/**
 * `JSON.stringify(file, null, 4)` would put each of the hundred thousand
 * coordinates on a line of its own, which is a 20 MB file no one can read a
 * diff of. One département per line keeps the file legible where it matters —
 * you see which of them moved — and small enough to bundle.
 */
function serialise(file: ContoursFile): string {
    const departements = Object.entries(file.departements)
        // Sorted here rather than on the object: JavaScript hoists integer-like
        // keys to the front of one, so "01" would follow "95" in the file.
        .sort(([a], [b]) => a.localeCompare(b))
        .map(
            ([code, departement]) =>
                `        ${JSON.stringify(code)}: ${JSON.stringify(departement)}`
        )
        .join(',\n')

    const json = [
        '{',
        `    "_metadata": ${JSON.stringify(file._metadata, null, 4).replaceAll('\n', '\n    ')},`,
        '    "departements": {',
        departements,
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
    const data = toContoursFile(await fetchDepartements())

    // Nothing is written until the whole payload has been validated, so a
    // failed run always leaves the committed dataset untouched.
    await writeFile(OUTPUT_URL, serialise(data), 'utf8')

    const departements = Object.values(data.departements)
    const points = departements.reduce(
        (total, { contour }) =>
            total + contour.reduce((sum, ring) => sum + ring.length, 0),
        0
    )

    console.log(`Generated ${OUTPUT_PATH}`)
    console.log(`Départements: ${departements.length.toLocaleString('en-US')}`)
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
