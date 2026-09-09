import {
    PAYS_ETRANGER,
    type Provenance,
} from '@shared/core/domain/value-objects/provenance'
import { normalize, type ReferenceData } from './reference-data'

/** How much confidence the reading of one cell deserves. */
export const EXPLICIT = 'Explicite'
export const EVEN_SPLIT = 'Répartition égale'
export const NEEDS_REVIEW = 'À vérifier'
export const UNRESOLVED = 'Non résolu'

export type Confidence =
    | typeof EXPLICIT
    | typeof EVEN_SPLIT
    | typeof NEEDS_REVIEW
    | typeof UNRESOLVED

export type ProvenanceShare = {
    source: Provenance['source']
    provenance: string
    percentage: number
}

export type ProvenanceReading = {
    distribution: ProvenanceShare[]
    confidence: Confidence
    unrecognized: string[]
}

/** A total written within one point of 100 is taken as meaning 100. */
const TOLERANCE = 1

// A département-shaped number: 97x, 2a/2b, or exactly two digits — never a
// slice of a longer number such as 100 or 2021.
const CODE = /(?<![0-9])(?:97[0-9]|2[ab]|[0-9]{2})(?![0-9])/g
const PERCENTAGE = /(\d+(?:\.\d+)?)\s*%/g
const MEASUREMENT =
    /\d+(?:\.\d+)?\s*(?:km|kwh|mwh|tonnes|tonne|ans|an|t|h)(?![a-z])/g
const WORD = /[a-z0-9.]+/g

// What can follow a number and prove it is not a département.
const IS_A_PERCENTAGE = /^\s*%/
const IS_A_MEASUREMENT = /^\s*(?:km|kwh|mwh|tonnes|tonne|ans|an|t|h)(?![a-z])/

/** Words that carry no place, so their presence is no reason to doubt. */
const NOISE_WORDS = new Set([
    'a',
    'au',
    'aux',
    'autour',
    'avec',
    'cellule',
    'chaufferie',
    'combustible',
    'dans',
    'de',
    'dep',
    'dept',
    'departement',
    'departements',
    'des',
    'dont',
    'dpt',
    'du',
    'en',
    'environ',
    'et',
    'ex',
    'exemple',
    'info',
    'infos',
    'installation',
    'la',
    'le',
    'les',
    'nom',
    'nomenclature',
    'ou',
    'par',
    'possible',
    'pour',
    'pourcentage',
    'pourcentages',
    'provenance',
    'provenances',
    'rayon',
    'repartition',
    'site',
    'soit',
    'sur',
    'total',
    'usine',
])

// Régions are recognisable and useless: a plan that says "Grand Est" has not
// said which département. They are matched only so they can be reported whole
// rather than word by word.
const REGION_NAMES = [
    'auvergne rhone alpes',
    'bourgogne franche comte',
    'bretagne',
    'centre val de loire',
    'corse',
    'grand est',
    'hauts de france',
    'ile de france',
    'normandie',
    'nouvelle aquitaine',
    'occitanie',
    'pays de la loire',
    'provence alpes cote d azur',
    'alsace',
    'aquitaine',
    'auvergne',
    'basse normandie',
    'bourgogne',
    'champagne ardenne',
    'franche comte',
    'haute normandie',
    'languedoc',
    'languedoc roussillon',
    'limousin',
    'lorraine',
    'midi pyrenees',
    'nord pas de calais',
    'picardie',
    'poitou charentes',
    'rhone alpes',
]

const REGIONS = new RegExp(
    '(?<![a-z])(?:' +
        REGION_NAMES.map((name) => name.replace(/ /g, '\\s+'))
            .sort((a, b) => b.length - a.length)
            .join('|') +
        ')(?![a-z])',
    'g'
)

type Span = { start: number; end: number }
type Mention = Span & { provenance: Provenance }
type Percentage = Span & { value: number }
type Place = { provenance: Provenance; share?: number; spans: Span[] }

function sum(values: readonly number[]): number {
    let total = 0
    let lost = 0

    for (const value of values) {
        const running = total + value

        lost +=
            Math.abs(total) >= Math.abs(value)
                ? total - running + value
                : value - running + total

        total = running
    }

    return total + lost
}

const overlaps = (span: Span, taken: readonly Span[]): boolean =>
    taken.some((other) => other.start < span.end && span.start < other.end)

const label = (provenance: Provenance): string =>
    provenance.source === PAYS_ETRANGER ? provenance.libelle : provenance.code

/** Two provenances name the same place when their source and label match. */
const keyOf = (provenance: Provenance): string =>
    `${provenance.source} ${label(provenance)}`

const spanOf = (match: RegExpExecArray | RegExpMatchArray): Span => ({
    start: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
})

/**
 * Every place named in words, longest name first so "haute marne" is not read
 * as "marne".
 */
function findNamedPlaces(text: string, reference: ReferenceData): Mention[] {
    const mentions: Mention[] = []
    const taken: Span[] = []

    for (const { provenance, pattern } of reference.names) {
        pattern.lastIndex = 0

        for (const match of text.matchAll(pattern)) {
            const span = spanOf(match)
            if (overlaps(span, taken)) continue

            taken.push(span)
            mentions.push({ ...span, provenance })
        }
    }

    return mentions
}

/** Every place named by its number, skipping numbers that are something else. */
function findNumberedPlaces(
    text: string,
    reference: ReferenceData,
    taken: readonly Span[]
): Mention[] {
    const mentions: Mention[] = []

    for (const match of text.matchAll(CODE)) {
        const code = match[0].toUpperCase()
        if (!reference.departements.has(code)) continue

        const span = spanOf(match)
        const after = text.slice(span.end)

        // "50 %" is a share and "50 km" a distance; neither is the Manche.
        if (IS_A_PERCENTAGE.test(after) || IS_A_MEASUREMENT.test(after))
            continue
        if (overlaps(span, taken)) continue

        mentions.push({
            ...span,
            provenance: { source: 'Département français', code },
        })
    }

    return mentions
}

/** "Vosges 88" names one place twice, and should be read as one mention. */
function mergeTouching(mentions: readonly Mention[], text: string): Mention[] {
    const merged: Mention[] = []

    for (const mention of [...mentions].sort((a, b) => a.start - b.start)) {
        const previous = merged[merged.length - 1]
        const samePlaceNextDoor =
            previous !== undefined &&
            keyOf(previous.provenance) === keyOf(mention.provenance) &&
            text.slice(previous.end, mention.start).trim() === ''

        if (samePlaceNextDoor) previous.end = mention.end
        else merged.push({ ...mention })
    }

    return merged
}

function findPlaces(text: string, reference: ReferenceData): Mention[] {
    const named = findNamedPlaces(text, reference)

    return mergeTouching(
        [...named, ...findNumberedPlaces(text, reference, named)],
        text
    )
}

const findPercentages = (text: string): Percentage[] =>
    [...text.matchAll(PERCENTAGE)].map((match) => ({
        ...spanOf(match),
        value: Number(match[1]),
    }))

/** "70% Vosges" — the share is written before its place. */
function pairSharesBefore(
    mentions: readonly Mention[],
    percentages: readonly Percentage[]
): Map<number, number> {
    const pairs = new Map<number, number>()

    percentages.forEach((percentage, percentageIndex) => {
        for (const [index, mention] of mentions.entries()) {
            if (mention.start < percentage.end || pairs.has(index)) continue

            // A share standing between the two claims that place instead.
            const claimedByAnother = percentages.some(
                (other) =>
                    percentage.end <= other.start && other.start < mention.start
            )
            if (claimedByAnother) break

            pairs.set(index, percentageIndex)
            break
        }
    })

    return pairs
}

/** "88-34%" — the share is written after its place. */
function pairSharesAfter(
    mentions: readonly Mention[],
    percentages: readonly Percentage[]
): Map<number, number> {
    const pairs = new Map<number, number>()

    percentages.forEach((percentage, percentageIndex) => {
        for (let index = mentions.length - 1; index >= 0; index--) {
            const mention = mentions[index]
            if (mention.end > percentage.start || pairs.has(index)) continue

            const claimedByAnother = percentages.some(
                (other, otherIndex) =>
                    otherIndex !== percentageIndex &&
                    mention.end <= other.start &&
                    other.end <= percentage.start
            )
            if (claimedByAnother) break

            pairs.set(index, percentageIndex)
            break
        }
    })

    return pairs
}

type Pairing = { shares: Map<number, number>; unpaired: Percentage[] }

/**
 * One reading order is chosen for the whole cell rather than per place: a plan
 * writes its shares one way throughout. Whichever order explains more of them
 * wins, and a tie goes to "70% Vosges", the common form.
 */
function pairShares(
    mentions: readonly Mention[],
    percentages: readonly Percentage[]
): Pairing {
    const before = pairSharesBefore(mentions, percentages)
    const after = pairSharesAfter(mentions, percentages)
    const pairs = after.size > before.size ? after : before
    const claimed = new Set(pairs.values())

    return {
        shares: new Map(
            [...pairs].map(([mention, percentage]) => [
                mention,
                percentages[percentage].value,
            ])
        ),
        unpaired: percentages.filter((_, index) => !claimed.has(index)),
    }
}

/** One entry per place, in the order the cell first names them. */
function groupByPlace(
    mentions: readonly Mention[],
    shares: ReadonlyMap<number, number>
): Place[] {
    const places = new Map<string, Place>()

    mentions.forEach((mention, index) => {
        const key = keyOf(mention.provenance)
        const share = shares.get(index)
        const span = { start: mention.start, end: mention.end }
        const found = places.get(key)

        if (found === undefined) {
            places.set(key, {
                provenance: mention.provenance,
                share,
                spans: [span],
            })
            return
        }

        found.spans.push(span)
        if (share !== undefined) found.share = (found.share ?? 0) + share
    })

    return [...places.values()]
}

/** Everything the reader looked at and could not place. */
function findUnreadWords(text: string, covered: readonly Span[]): Span[] {
    const unread: Span[] = []
    const seen = [...covered]

    // Régions first, so a name of several words is reported whole.
    for (const match of text.matchAll(REGIONS)) {
        const span = spanOf(match)
        if (overlaps(span, seen)) continue

        unread.push(span)
        seen.push(span)
    }

    for (const match of text.matchAll(WORD)) {
        const word = match[0]
        const span = spanOf(match)
        const isNoise =
            NOISE_WORDS.has(word) || (word.length === 1 && /[a-z]/.test(word))

        if (isNoise || overlaps(span, seen)) continue

        unread.push(span)
    }

    return unread
}

function buildDistribution(
    text: string,
    mentions: readonly Mention[],
    percentages: readonly Percentage[],
    pairing: Pairing
): ProvenanceReading {
    let places = groupByPlace(mentions, pairing.shares)
    let leftOver: Span[] = pairing.unpaired.map(({ start, end }) => ({
        start,
        end,
    }))

    const written = places.filter((place) => place.share !== undefined)
    const bare = places.filter((place) => place.share === undefined)

    let confidence: Confidence

    if (places.length === 0) {
        confidence = UNRESOLVED
    } else if (written.length === 0) {
        // No share was written anywhere, so the cell means "equally".
        const each = 100 / places.length
        places.forEach((place) => (place.share = each))
        confidence = EVEN_SPLIT
    } else {
        const total = sum(written.map((place) => place.share ?? 0))
        const remainder = 100 - total

        if (bare.length > 0 && remainder > TOLERANCE) {
            // "60% 88, 68, 54" — the silent places share what is left.
            const each = remainder / bare.length
            bare.forEach((place) => (place.share = each))
            confidence = NEEDS_REVIEW
        } else if (bare.length > 0) {
            // Nothing is left to give them, so they were never really claimed.
            leftOver = [...leftOver, ...bare.flatMap((place) => place.spans)]
            places = written
            confidence = NEEDS_REVIEW
        } else {
            confidence =
                Math.abs(total - 100) <= TOLERANCE ? EXPLICIT : NEEDS_REVIEW
        }

        const claimed = sum(places.map((place) => place.share ?? 0))
        if (places.length === 0 || claimed <= 0) {
            places = []
            confidence = UNRESOLVED
        }
    }

    if (places.length > 0) {
        const total = sum(places.map((place) => place.share ?? 0))

        // Multiplying before dividing keeps the arithmetic bit-for-bit what the
        // reference implementation produces.
        places = places.map((place) => ({
            ...place,
            share: ((place.share ?? 0) * 100) / total,
        }))
    }

    const covered: Span[] = [
        ...places.flatMap((place) => place.spans),
        ...percentages.map(({ start, end }) => ({ start, end })),
        ...[...text.matchAll(MEASUREMENT)].map(spanOf),
    ]

    const unread = [
        ...leftOver,
        ...findUnreadWords(text, [...covered, ...leftOver]),
    ]

    if (
        unread.length > 0 &&
        (confidence === EXPLICIT || confidence === EVEN_SPLIT)
    ) {
        confidence = NEEDS_REVIEW
    }

    const words = unread.map(
        ({ start, end }) => [start, text.slice(start, end)] as const
    )
    words.sort(
        ([aStart, aWord], [bStart, bWord]) =>
            aStart - bStart || (aWord < bWord ? -1 : aWord > bWord ? 1 : 0)
    )

    return {
        distribution: places.map((place) => ({
            source: place.provenance.source,
            provenance: label(place.provenance),
            percentage: place.share ?? 0,
        })),
        confidence,
        unrecognized: words.map(([, word]) => word),
    }
}

/**
 * Reads a free-text provenance cell into shares adding up to 100, and says how
 * much of the cell it managed to account for.
 */
export function transformProvenance(
    raw: string,
    reference: ReferenceData
): ProvenanceReading {
    const text = normalize(raw)
    const mentions = findPlaces(text, reference)
    const percentages = findPercentages(text)

    return buildDistribution(
        text,
        mentions,
        percentages,
        pairShares(mentions, percentages)
    )
}
