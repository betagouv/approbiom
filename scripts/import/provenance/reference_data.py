
import json
import re
import unicodedata
from pathlib import Path
from typing import NamedTuple

### Domain labels


DEPARTEMENT_FRANCAIS = "Département français"
PAYS_ETRANGER = "Pays étranger"


### Reference datasets

LOCALIZATION_PATH = (
    Path(__file__).resolve().parents[3] / "shared" / "infrastructure" / "localization"
)
DEPARTEMENTS_PATH = LOCALIZATION_PATH / "departements-contours.json"
COUNTRIES_PATH = LOCALIZATION_PATH / "countries-contours.json"

# French soil, which geoBoundaries lists as territories of its own. None of it
# is a "pays étranger", so it is kept out of the countries index, by ISO 3166-1
# alpha-3 rather than by label — "Guyane française" would otherwise slip through
# next to the département named plain "Guyane".
#
# GLP/MTQ/GUF/REU/MYT are the five DOM: they are already in the index as
# départements 971 to 976. The rest are collectivités, which
# shared/core/domain/value-objects/departement.ts deliberately leaves out — a
# plan reported under one of them is a column not saying what it should, and it
# belongs in "unrecognized" rather than in a distribution.
NOT_A_FOREIGN_COUNTRY = {
    "FRA",
    "GLP",
    "MTQ",
    "GUF",
    "REU",
    "MYT",
    "SPM",
    "BLM",
    "MAF",
    "PYF",
    "NCL",
    "WLF",
    "ATF",
}


# Examples:
#   {"source": DEPARTEMENT_FRANCAIS, "code": "88"}
#   {"source": PAYS_ETRANGER, "libelle": "Espagne"}
Provenance = dict[str, str]


class ReferenceData(NamedTuple):

    # {"88": "Vosges"}
    departements: dict[str, str]

    # (normalized name, provenance), longest first. The order is what makes
    # "haute loire" win over "loire": the first one to match is right.
    names: list[tuple[str, Provenance]]


def departement_provenance(code: str) -> Provenance:
    return {"source": DEPARTEMENT_FRANCAIS, "code": code}


def country_provenance(libelle: str) -> Provenance:
    return {"source": PAYS_ETRANGER, "libelle": libelle}


def normalize(text: str) -> str:
    """Flatten the text so a place name can be found in it reliably.

    Accents dropped, lowercased, punctuation turned into spaces. Only letters,
    digits, "%" and the dot of a decimal percentage survive.

        "Meurthe-et-Moselle (54)" -> "meurthe et moselle 54"
        "88,68"                   -> "88 68"
    """
    # Decimal percentages first, while the comma is still there to tell them
    # apart: without this "33,5%" would become "33 5%", which reads as "5%". An
    # error that does not show is worse than a value that is refused.
    text = re.sub(r"(\d+)[.,](\d+)(\s*%)", r"\1.\2\3", text)

    without_accents = "".join(
        char
        for char in unicodedata.normalize("NFD", text)
        if not unicodedata.combining(char)
    )

    lowered = without_accents.lower()
    kept = re.sub(r"[^a-z0-9%.]", " ", lowered)

    # A dot only ever meant something between two digits.
    without_stray_dots = re.sub(r"(?<![0-9])\.|\.(?![0-9])", " ", kept)

    return " ".join(without_stray_dots.split())


def build_reference_data(
    departements: dict[str, str], countries: dict[str, str]
) -> ReferenceData:
    """Build the lookup index. Kept apart from the loading so tests can work on
    a handful of places rather than on all 331."""
    names: list[tuple[str, Provenance, int]] = []

    for code, nom in departements.items():
        names.append((normalize(nom), departement_provenance(code), 0))

    for iso3, libelle in countries.items():
        if iso3 in NOT_A_FOREIGN_COUNTRY:
            continue
        names.append((normalize(libelle), country_provenance(libelle), 1))

    # Longest first; on equal length the département wins over the country
    names.sort(key=lambda entry: (-len(entry[0]), entry[2]))

    return ReferenceData(
        departements=dict(departements),
        names=[(name, provenance) for name, provenance, _ in names],
    )


def load_departements(path: Path = DEPARTEMENTS_PATH) -> dict[str, str]:
    """Return {code: name}, for example {"01": "Ain", "2A": "Corse-du-Sud"}."""
    with path.open(encoding="utf-8") as f:
        data = json.load(f)

    return {code: departement["nom"] for code, departement in data["departements"].items()}


def load_countries(path: Path = COUNTRIES_PATH) -> dict[str, str]:
    """Return {iso3: French label}, for example {"ESP": "Espagne"}."""
    with path.open(encoding="utf-8") as f:
        data = json.load(f)

    return {iso3: country["nom"] for iso3, country in data["countries"].items()}


def load_reference_data() -> ReferenceData:
    return build_reference_data(load_departements(), load_countries())
