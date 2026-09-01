from provenance.reference_data import (
    DEPARTEMENT_FRANCAIS,
    PAYS_ETRANGER,
    build_reference_data,
    load_reference_data,
    normalize,
)

DEPARTEMENTS = {
    "08": "Ardennes",
    "10": "Aube",
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

COUNTRIES = {
    "ESP": "Espagne",
    "DEU": "Allemagne",
    "BEL": "Belgique",
    "FRA": "France",
}

REFERENCE_DATA = build_reference_data(DEPARTEMENTS, COUNTRIES)


### normalize


def test_it_removes_accents_and_lowers():
    assert normalize("Haute-Saône") == "haute saone"
    assert normalize("GRAND EST") == "grand est"


def test_it_turns_punctuation_into_spaces():
    assert normalize("Meurthe-et-Moselle (54)") == "meurthe et moselle 54"
    assert normalize("88,68") == "88 68"
    assert normalize("50% - 08 / 25% - 55") == "50% 08 25% 55"


def test_it_keeps_decimal_percentages_readable():
    # Without the guard, "33,5%" would become "33 5%" and read as "5%".
    assert normalize("33,5%") == "33.5%"
    assert normalize("33.5 %") == "33.5 %"


def test_it_drops_a_dot_that_is_not_a_decimal():
    assert normalize("Ex. : 88") == "ex 88"
    assert normalize("S.A. Vosges") == "s a vosges"


def test_it_collapses_whitespace():
    assert normalize("  100 km   autour  de l'installation ") == (
        "100 km autour de l installation"
    )


### build_reference_data


def indexed_as(name: str):
    return [
        provenance for indexed, provenance in REFERENCE_DATA.names if indexed == name
    ]


def test_it_indexes_departements_by_normalized_name():
    assert indexed_as("vosges") == [{"source": DEPARTEMENT_FRANCAIS, "code": "88"}]
    assert indexed_as("meurthe et moselle") == [
        {"source": DEPARTEMENT_FRANCAIS, "code": "54"}
    ]


def test_it_indexes_countries_by_normalized_name():
    assert indexed_as("espagne") == [{"source": PAYS_ETRANGER, "libelle": "Espagne"}]


def test_it_leaves_france_out_of_the_countries():
    assert indexed_as("france") == []


def test_it_sorts_the_longest_names_first():
    # Which is what will make "haute marne" win over "marne" when searching.
    names = [name for name, _ in REFERENCE_DATA.names]

    assert names == sorted(names, key=len, reverse=True)
    assert names.index("haute marne") < names.index("marne")


### The bundled datasets


def test_it_loads_the_bundled_datasets():
    reference_data = load_reference_data()

    assert len(reference_data.departements) == 101
    assert reference_data.departements["88"] == "Vosges"
    assert reference_data.departements["2A"] == "Corse-du-Sud"
    assert reference_data.departements["976"] == "Mayotte"

    indexed = dict(reference_data.names)
    assert indexed["espagne"] == {"source": PAYS_ETRANGER, "libelle": "Espagne"}
    assert indexed["allemagne"] == {"source": PAYS_ETRANGER, "libelle": "Allemagne"}
    assert "france" not in indexed


def test_french_soil_is_never_a_foreign_country():
    indexed = dict(load_reference_data().names)

    # The five DOM are in the countries dataset too. They are départements.
    assert indexed["guadeloupe"] == {"source": DEPARTEMENT_FRANCAIS, "code": "971"}
    assert indexed["mayotte"] == {"source": DEPARTEMENT_FRANCAIS, "code": "976"}

    # And the label the countries dataset gives 973 is not the one the
    # départements dataset gives it, so a name clash would not have caught this.
    assert "guyane francaise" not in indexed
    assert indexed["guyane"] == {"source": DEPARTEMENT_FRANCAIS, "code": "973"}

    # The collectivités are neither. They belong in "unrecognized".
    assert "nouvelle caledonie" not in indexed
    assert "polynesie francaise" not in indexed
    assert "saint barthelemy" not in indexed


def test_no_two_real_places_share_a_name():
    # If two places shared a normalized name, the search would pick one of them
    # at random. Better to find out here than on a line of data.
    names = [name for name, _ in load_reference_data().names]

    assert len(names) == len(set(names))
