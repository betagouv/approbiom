// Regenerates departements-contours.json from IGN's Admin Express COG Carto WFS
// (geo.api.gouv.fr has no département geometry): `pnpm generate:referentiels departements`

import { writeFile } from 'node:fs/promises'

const SOURCE = 'https://data.geopf.fr/'

// `COUNT` only has to clear the 101 départements; checked against `numberMatched` below.
const ENDPOINT =
    'https://data.geopf.fr/wfs/ows?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0&TYPENAMES=ADMINEXPRESS-COG-CARTO.LATEST:departement&OUTPUTFORMAT=application/json&SRSNAME=EPSG:4326&COUNT=200'

const OUTPUT_URL = new URL('./departements-contours.json', import.meta.url)
export const OUTPUT_PATH =
    'shared/infrastructure/referentiel-geo/departements-contours.json'

// Degrees (~100 m); IGN's metre-precise coastline would weigh 20 MB.
const TOLERANCE = 0.001

// ~1 m.
const DECIMALS = 5

/** [longitude, latitude]. */
type GeoJsonPoint = [number, number]

type ApiFeature = {
    properties?: {
        code_insee?: string
        nom_officiel?: string
    }
    geometry?: {
        type?: string
        coordinates?: GeoJsonPoint[][] | GeoJsonPoint[][][]
    }
}

/** [latitude, longitude], the order Leaflet reads. */
type Ring = [number, number][]

type Departement = {
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

/** Holes (enclaves of a neighbour) and rings flattened below four points are dropped. */
function toContour(geometry: ApiFeature['geometry']): Ring[] {
    const { type, coordinates } = geometry ?? {}
    if (!Array.isArray(coordinates)) return []

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

    // The WFS pages silently.
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

function describe(feature: unknown): string {
    if (typeof feature === 'object' && feature !== null) {
        const { properties } = feature as ApiFeature
        if (properties?.code_insee !== undefined) return properties.code_insee
    }
    return '(feature without a code)'
}

/** One département per line, for readable diffs and a bundle-sized file. */
function serialise(file: ContoursFile): string {
    const departements = Object.entries(file.departements)
        // Not on an object: JavaScript hoists integer-like keys, so "01" would follow "95".
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

    // Assembled by hand: validate before it replaces the committed file.
    JSON.parse(json)
    return json
}

export async function generateDepartementsContours(): Promise<void> {
    const data = toContoursFile(await fetchDepartements())

    // Written last: a failed run leaves the committed dataset untouched.
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
