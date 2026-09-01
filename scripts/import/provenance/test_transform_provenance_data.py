from provenance.reference_data import (
    DEPARTEMENT_FRANCAIS,
    PAYS_ETRANGER,
    build_reference_data,
    normalize,
)
from provenance.transform_provenance_data import find_location_mentions

DEPARTEMENTS = {
    "08": "Ardennes",
    "10": "Aube",
    "34": "Hérault",
    "50": "Manche",
    "51": "Marne",
    "52": "Haute-Marne",
    "54": "Meurthe-et-Moselle",
    "55": "Meuse",
    "57": "Moselle",
    "67": "Bas-Rhin",
    "68": "Haut-Rhin",
    "69": "Rhône",
    "70": "Haute-Saône",
    "88": "Vosges",
    "90": "Territoire de Belfort",
}

COUNTRIES = {"ESP": "Espagne", "DEU": "Allemagne", "BEL": "Belgique", "FRA": "France"}

REFERENCE_DATA = build_reference_data(DEPARTEMENTS, COUNTRIES)


def places_named_in(raw: str) -> list[str]:
    """The places found, as a reader would name them: a code, or a country."""
    return [
        mention.provenance.get("code") or mention.provenance["libelle"]
        for mention in find_location_mentions(normalize(raw), REFERENCE_DATA)
    ]


### The strings the plans actually contain


def test_it_finds_codes_listed_bare():
    assert places_named_in("88,68") == ["88", "68"]
    assert places_named_in("88, 68, 55") == ["88", "68", "55"]
    assert places_named_in("88,68,67,69,52,54,55,57,90,70") == [
        "88",
        "68",
        "67",
        "69",
        "52",
        "54",
        "55",
        "57",
        "90",
        "70",
    ]


def test_it_finds_names_and_countries():
    assert places_named_in(
        "70% Vosges (88) + 20% Meurthe-et-Moselle (54) + 10% Espagne"
    ) == ["88", "54", "Espagne"]


def test_it_finds_codes_between_percentages():
    assert places_named_in("60% 57 / 20% 54 / 20% 55") == ["57", "54", "55"]
    assert places_named_in("50% - 08 / 25% - 55 / 25% - 51") == ["08", "55", "51"]
    assert places_named_in("50% (10) - 50% (52)") == ["10", "52"]
    assert places_named_in("Ex : 88-34%, 67-33%, 68-33%") == ["88", "67", "68"]


def test_it_finds_nothing_in_a_region_or_a_radius():
    # Neither is a place the domain can hold. Better empty than invented.
    assert places_named_in("GRAND EST") == []
    assert places_named_in("100 km autour de l'installation") == []


def test_it_finds_the_installation_department_too():
    # "dpt 54" is where the boiler is, not where the wood comes from — but
    # nothing in the text says so. It is reported, and sorted out later.
    assert places_named_in(
        "Ex nomenclature ; 100 km autour de la chaufferie dpt 54 100% Vosges"
    ) == ["54", "88"]


def test_it_ignores_france_but_keeps_the_foreign_country():
    assert places_named_in("50%France, 50% Allemagne") == ["Allemagne"]


### The guards, which is what this pass is really for


def test_a_number_followed_by_a_percent_sign_is_not_a_code():
    # 50 is the Manche, 10 is the Aube. Here they are shares.
    assert places_named_in("50% (10) - 50% (52)") == ["10", "52"]
    assert places_named_in("50 % 10") == ["10"]


def test_a_distance_is_not_a_code():
    # 100 survives no slicing: "10" is followed by a digit, "00" preceded by one.
    assert places_named_in("100 km autour de l'installation") == []
    # 50 is a real code, so only the unit keeps it out.
    assert places_named_in("50 km autour de l'installation") == []


def test_a_year_is_not_a_code():
    assert places_named_in("BCIAT 2021") == []


def test_a_place_named_twice_is_found_once():
    assert places_named_in("100 km autour de l'installation ou 100 % Vosges (88)") == [
        "88"
    ]
    assert places_named_in("Vosges (88)") == ["88"]
    assert places_named_in("88 Vosges") == ["88"]


def test_the_longest_name_wins():
    assert places_named_in("Haute-Marne") == ["52"]
    assert places_named_in("Marne") == ["51"]
    assert places_named_in("Bas-Rhin et Haut-Rhin") == ["67", "68"]


def test_a_name_inside_a_word_is_not_a_place():
    # "Aube" sits inside "Aubergiste", "Ain" inside "Terrain".
    assert places_named_in("Aubergiste") == []
    assert places_named_in("Terrain communal") == []


def test_it_reports_where_each_place_was_named():
    text = normalize("70% Vosges (88) + 10% Espagne")
    mentions = find_location_mentions(text, REFERENCE_DATA)

    assert text == "70% vosges 88 10% espagne"
    # "vosges 88" is one mention spanning both halves, hence 4 to 13.
    assert [(mention.start, mention.end) for mention in mentions] == [(4, 13), (18, 25)]
    assert text[4:13] == "vosges 88"
    assert text[18:25] == "espagne"
    assert mentions[0].provenance == {"source": DEPARTEMENT_FRANCAIS, "code": "88"}
    assert mentions[1].provenance == {"source": PAYS_ETRANGER, "libelle": "Espagne"}
