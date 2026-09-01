import re
from typing import NamedTuple

from provenance.reference_data import (
    Provenance,
    ReferenceData,
    departement_provenance,
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


def check_is_french_deparment_postcode(raw_value: str, departements: dict[str, str]) -> bool:
    department = raw_value[:2]
    return department in departements


def get_french_departments_from_string(text: str, departements: dict[str, str]) -> list[str]:
    result = []
    values = text.split(",")

    for value in values:
        if check_is_french_deparment_postcode(value, departements):
            result.append(value)

    return result


def transform_provenance_data(raw_provenance: str, departements: dict[str, str]) -> str | None:
    if raw_provenance == "":
        return None

    # Détecter les départements
    # Détecter les pays
    # Détecter les répartitions
    # Noter le niveau de confiance du tonnage
    # Vérifier que la somme totale des tonnages calculées est bien égale au Tonnage donné.
    return "coucou"
