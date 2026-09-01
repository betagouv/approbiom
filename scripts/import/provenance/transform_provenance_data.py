import re
from typing import NamedTuple, NotRequired, TypedDict

from provenance.reference_data import (
    Provenance,
    ReferenceData,
    departement_provenance,
    normalize,
)


### Finding the places a cell names

MATCHED_BY_NAME = "name"
MATCHED_BY_CODE = "code"


class Mention(NamedTuple):
    """A place the text names, and where it names it.

    Positions are what let a percentage be paired with the right place later on,
    so they are carried all the way through rather than thrown away here.
    """

    start: int
    end: int
    provenance: Provenance
    matched_by: str


# A number that could be a département code: two digits, three for the DOM, or
# Corsica's 2A/2B. The lookarounds are what keep "100" and "2021" out — no
# two-digit slice of a longer run of digits can match.
CODE_PATTERN = re.compile(r"(?<![0-9])(?:97[0-9]|2[ab]|[0-9]{2})(?![0-9])")

# A number followed by "%" is a share, not a place. Without this, "50% (10)"
# would report the Manche alongside the Aube — half the département codes are
# also plausible percentages.
A_PERCENTAGE = re.compile(r"\s*%")

# What a number is measuring when one of these follows it. "50 km autour de
# l'installation" would otherwise read as the Manche.
A_MEASUREMENT = re.compile(r"\s*(?:km|kwh|mwh|tonnes|tonne|ans|an|t|h)(?![a-z])")


def overlaps(start: int, end: int, taken: list[tuple[int, int]]) -> bool:
    return any(
        taken_start < end and start < taken_end for taken_start, taken_end in taken
    )


def find_name_mentions(text: str, reference_data: ReferenceData) -> list[Mention]:
    """Places named in full. Longest name first, so "haute marne" is read as the
    Haute-Marne rather than as the Marne with a stray word in front."""
    mentions: list[Mention] = []
    taken: list[tuple[int, int]] = []

    for name, provenance in reference_data.names:
        pattern = rf"(?<![a-z0-9]){re.escape(name)}(?![a-z0-9])"

        for match in re.finditer(pattern, text):
            if overlaps(match.start(), match.end(), taken):
                continue

            taken.append((match.start(), match.end()))
            mentions.append(
                Mention(match.start(), match.end(), provenance, MATCHED_BY_NAME)
            )

    return mentions


def find_code_mentions(
    text: str, reference_data: ReferenceData, taken: list[tuple[int, int]]
) -> list[Mention]:
    """Places named by their number. This is where the false positives live, so
    every match has to survive the guards above."""
    mentions: list[Mention] = []

    for match in CODE_PATTERN.finditer(text):
        code = match.group().upper()
        if code not in reference_data.departements:
            continue

        after = text[match.end() :]
        if A_PERCENTAGE.match(after) or A_MEASUREMENT.match(after):
            continue

        if overlaps(match.start(), match.end(), taken):
            continue

        mentions.append(
            Mention(
                match.start(),
                match.end(),
                departement_provenance(code),
                MATCHED_BY_CODE,
            )
        )

    return mentions


def merge_adjacent_mentions(mentions: list[Mention], text: str) -> list[Mention]:
    """"Vosges (88)" names one place twice. Counted twice it would take two
    shares of the tonnage, so touching mentions of the same place become one."""
    merged: list[Mention] = []

    for mention in sorted(mentions, key=lambda found: found.start):
        previous = merged[-1] if merged else None
        names_the_same_place = (
            previous is not None
            and previous.provenance == mention.provenance
            and text[previous.end : mention.start].strip() == ""
        )

        if names_the_same_place:
            merged[-1] = merged[-1]._replace(end=mention.end)
            continue

        merged.append(mention)

    return merged


def find_location_mentions(text: str, reference_data: ReferenceData) -> list[Mention]:
    """Every place the text names, in the order it names them.

    `text` is expected to have been through `normalize` already: the positions
    are only meaningful against the string that was searched.
    """
    by_name = find_name_mentions(text, reference_data)
    taken = [(mention.start, mention.end) for mention in by_name]
    by_code = find_code_mentions(text, reference_data, taken)

    return merge_adjacent_mentions(by_name + by_code, text)


### Finding the shares, and deciding which place each one belongs to

ORIENTATION_FOLLOWS = "follows"
ORIENTATION_PRECEDES = "precedes"

PERCENTAGE_PATTERN = re.compile(r"(\d+(?:\.\d+)?)\s*%")


class Percentage(NamedTuple):
    start: int
    end: int
    value: float


class Pairing(NamedTuple):
    """Which place each share was given to, once the reading order is settled."""

    orientation: str # Follow or preceed

    # Index into the mentions -> the share it was given.
    shares: dict[int, float]

    # Shares that found no place to belong to. One of these means something in
    # the cell was not understood, however well the rest was read.
    unpaired: list[Percentage]


def find_percentages(text: str) -> list[Percentage]:
    """`text` is expected to have been through `normalize` already."""
    return [
        Percentage(match.start(), match.end(), float(match.group(1)))
        for match in PERCENTAGE_PATTERN.finditer(text)
    ]


def pair_looking_forward(
    mentions: list[Mention], percentages: list[Percentage]
) -> dict[int, int]:
    """Read as "70% Vosges": each share names the place that comes after it."""
    pairs: dict[int, int] = {}

    for percentage_index, percentage in enumerate(percentages):
        for mention_index, mention in enumerate(mentions):
            if mention.start < percentage.end or mention_index in pairs:
                continue

            # Another share standing in between means that place belongs to it,
            # not to this one.
            if any(
                percentage.end <= other.start < mention.start for other in percentages
            ):
                break

            pairs[mention_index] = percentage_index
            break

    return pairs


def pair_looking_backward(
    mentions: list[Mention], percentages: list[Percentage]
) -> dict[int, int]:
    """Read as "88-34%": each share names the place that comes before it."""
    pairs: dict[int, int] = {}

    for percentage_index, percentage in enumerate(percentages):
        for mention_index in reversed(range(len(mentions))):
            mention = mentions[mention_index]
            if mention.end > percentage.start or mention_index in pairs:
                continue

            if any(
                other is not percentage
                and mention.end <= other.start
                and other.end <= percentage.start
                for other in percentages
            ):
                break

            pairs[mention_index] = percentage_index
            break

    return pairs


def pair_percentages_with_mentions(
    mentions: list[Mention], percentages: list[Percentage]
) -> Pairing:
    """Settle whether the cell writes the share before or after the place.

    The choice is made once for the whole string rather than mention by
    mention: "Ex : 88-34%, 67-33%, 68-33%" only reads correctly if all three
    shares are taken the same way round. Whichever reading accounts for more of
    them wins, and a tie goes to "70% Vosges", by far the more common form.
    """
    forward = pair_looking_forward(mentions, percentages)
    backward = pair_looking_backward(mentions, percentages)

    orientation, pairs = (
        (ORIENTATION_PRECEDES, backward)
        if len(backward) > len(forward)
        else (ORIENTATION_FOLLOWS, forward)
    )

    return Pairing(
        orientation=orientation,
        shares={
            mention_index: percentages[percentage_index].value
            for mention_index, percentage_index in pairs.items()
        },
        unpaired=[
            percentage
            for index, percentage in enumerate(percentages)
            if index not in pairs.values()
        ],
    )


### Turning what was read into a distribution

# The cell was read whole and its shares add up.
EXPLICIT = "EXPLICIT"

# The cell named places but no shares, so they were given one each.
EVEN_SPLIT = "EVEN_SPLIT"

# Something was read, but not all of it, or not to 100. Needs a human.
NEEDS_REVIEW = "NEEDS_REVIEW"

# Nothing in the cell named a place the domain can hold.
UNRESOLVED = "UNRESOLVED"

# How far the shares a cell writes may sit from 100 and still be read as
# rounding rather than as a mistake: "33% / 33% / 33%" lands on 99 and means
# the same thing as "34% / 33% / 33%".
ROUNDING_TOLERANCE = 1.0

# Words that carry no provenance. Left out of "unrecognized" so that a cell is
# only flagged for something a reader would also puzzle over. This is source
# data, not code, hence French.
NOISE_WORDS = {
    "a", "au", "aux", "autour", "avec",
    "cellule", "chaufferie", "combustible",
    "dans", "de", "dep", "dept", "departement", "departements", "des", "dont",
    "dpt", "du",
    "en", "environ", "est", "et", "ex", "exemple",
    "info", "infos", "installation",
    "la", "le", "les",
    "nom", "nomenclature",
    "ou",
    "par", "possible", "pour", "pourcentage", "pourcentages", "provenance",
    "provenances",
    "rayon", "repartition",
    "site", "soit", "sur",
    "total",
    "usine",
}

# A number and what it measures, taken together so that the "100" of "100 km"
# is not reported as an unread fragment.
MEASUREMENT_PATTERN = re.compile(
    r"\d+(?:\.\d+)?\s*(?:km|kwh|mwh|tonnes|tonne|ans|an|t|h)(?![a-z])"
)

# "%" is deliberately not part of a word: "50%France" is written without a
# space, and one token would let the share swallow the place next to it.
WORD_PATTERN = re.compile(r"[a-z0-9.]+")


class DistributionEntry(TypedDict):
    """A Provenance, plus the share of the tonnage it accounts for.

    "code" and "libelle" are the two halves of the domain's union: an entry
    carries one or the other, never both.
    """

    source: str
    code: NotRequired[str]
    libelle: NotRequired[str]
    percentage: float


class ProvenanceResult(TypedDict):
    distribution: list[DistributionEntry]
    status: str
    unrecognized: list[str]


class Place(NamedTuple):
    """One place, gathering every mention of it in the cell."""

    provenance: Provenance
    share: float | None
    spans: list[tuple[int, int]]


def group_mentions_by_place(mentions: list[Mention], pairing: Pairing) -> list[Place]:
    """A cell naming the same place twice describes one provenance, not two, so
    its mentions are gathered and their shares added."""
    places: dict[tuple[tuple[str, str], ...], Place] = {}

    for index, mention in enumerate(mentions):
        key = tuple(sorted(mention.provenance.items()))
        found = places.get(key)
        share = pairing.shares.get(index)

        if found is None:
            places[key] = Place(mention.provenance, share, [(mention.start, mention.end)])
            continue

        places[key] = found._replace(
            share=found.share if share is None else (found.share or 0.0) + share,
            spans=found.spans + [(mention.start, mention.end)],
        )

    return list(places.values())


def as_distribution_entry(place: Place) -> DistributionEntry:
    source = place.provenance["source"]
    share = place.share or 0.0
    code = place.provenance.get("code")

    if code is not None:
        return {"source": source, "code": code, "percentage": share}

    return {
        "source": source,
        "libelle": place.provenance["libelle"],
        "percentage": share,
    }


def find_unread_words(text: str, covered: list[tuple[int, int]]) -> list[tuple[int, str]]:
    """The words the reading never accounted for, minus the ones that carry no
    provenance anyway."""
    unread = []

    for match in WORD_PATTERN.finditer(text):
        word = match.group()
        is_noise = word in NOISE_WORDS or (len(word) == 1 and word.isalpha())

        if is_noise or overlaps(match.start(), match.end(), covered):
            continue

        unread.append((match.start(), word))

    return unread


def scale_to_one_hundred(places: list[Place]) -> list[Place]:
    total = sum(place.share or 0.0 for place in places)

    return [
        place._replace(share=(place.share or 0.0) * 100.0 / total) for place in places
    ]


def build_distribution(
    text: str,
    mentions: list[Mention],
    percentages: list[Percentage],
    pairing: Pairing,
) -> ProvenanceResult:
    """Weigh what was read against what was left over, and say which it is.

    The shares always come out summing to 100, because a distribution that does
    not is a tonnage silently gained or lost downstream. What varies is the
    status, which says how much of that 100 the cell actually justified.
    """
    places = group_mentions_by_place(mentions, pairing)
    left_over = [
        (percentage.start, percentage.end) for percentage in pairing.unpaired
    ]

    if not places:
        status = UNRESOLVED
    elif all(place.share is None for place in places):
        share_each = 100.0 / len(places)
        places = [place._replace(share=share_each) for place in places]
        status = EVEN_SPLIT
    else:
        written_total = sum(place.share for place in places if place.share is not None)
        without_share = [place for place in places if place.share is None]
        remainder = 100.0 - written_total

        if without_share and remainder > ROUNDING_TOLERANCE:
            # The cell wrote some shares and left places bare: the shares it did
            # not write are what is missing from 100.
            share_each = remainder / len(without_share)
            places = [
                place._replace(share=share_each) if place.share is None else place
                for place in places
            ]
            status = NEEDS_REVIEW
        elif without_share:
            # Nothing left to give them — "dpt 54 100% Vosges" is the shape of
            # this. They are dropped, and reported as unread.
            left_over += [span for place in without_share for span in place.spans]
            places = [place for place in places if place.share is not None]
            status = NEEDS_REVIEW
        else:
            status = (
                EXPLICIT
                if abs(written_total - 100.0) <= ROUNDING_TOLERANCE
                else NEEDS_REVIEW
            )

        if not places or sum(place.share or 0.0 for place in places) <= 0.0:
            places, status = [], UNRESOLVED

    if places:
        places = scale_to_one_hundred(places)

    covered = (
        [span for place in places for span in place.spans]
        + [(percentage.start, percentage.end) for percentage in percentages]
        + [(match.start(), match.end()) for match in MEASUREMENT_PATTERN.finditer(text)]
    )
    unread = [(start, text[start:end]) for start, end in left_over]
    unread += find_unread_words(text, covered + left_over)

    if unread and status in (EXPLICIT, EVEN_SPLIT):
        status = NEEDS_REVIEW

    return ProvenanceResult(
        distribution=[as_distribution_entry(place) for place in places],
        status=status,
        unrecognized=[word for _, word in sorted(unread)],
    )


def transform_provenance_data(
    raw_provenance: object, reference_data: ReferenceData
) -> ProvenanceResult:
    """Read a "répartition par département" cell into shares of the tonnage.

    Applying those shares to an actual tonnage is somebody else's job: this only
    says where the fuel comes from, and how much of the cell it had to guess at.

    The cell is taken as it comes out of the workbook rather than as a string: a
    cell naming one département is stored as the number 88, not as "88".
    """
    text = normalize("" if raw_provenance is None else str(raw_provenance))
    mentions = find_location_mentions(text, reference_data)
    percentages = find_percentages(text)

    return build_distribution(
        text, mentions, percentages, pair_percentages_with_mentions(mentions, percentages)
    )




