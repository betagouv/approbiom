from provenance.reference_data import (
    DEPARTEMENT_FRANCAIS,
    PAYS_ETRANGER,
    build_reference_data,
    normalize,
)
import pytest

from provenance.transform_provenance_data import (
    EVEN_SPLIT,
    EXPLICIT,
    NEEDS_REVIEW,
    ORIENTATION_FOLLOWS,
    ORIENTATION_PRECEDES,
    UNRESOLVED,
    find_location_mentions,
    find_percentages,
    pair_percentages_with_mentions,
    transform_provenance_data,
)

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


### Finding the shares


def shares_in(raw: str) -> dict[str, float]:
    """The share each place was given, keyed the way a reader would name it."""
    text = normalize(raw)
    mentions = find_location_mentions(text, REFERENCE_DATA)
    pairing = pair_percentages_with_mentions(mentions, find_percentages(text))

    return {
        mentions[index].provenance.get("code")
        or mentions[index].provenance["libelle"]: share
        for index, share in sorted(pairing.shares.items())
    }


def orientation_of(raw: str) -> str:
    text = normalize(raw)

    return pair_percentages_with_mentions(
        find_location_mentions(text, REFERENCE_DATA), find_percentages(text)
    ).orientation


def test_it_reads_a_percentage_written_before_the_place():
    assert orientation_of("70% Vosges (88) + 20% Meurthe-et-Moselle (54)") == (
        ORIENTATION_FOLLOWS
    )
    assert shares_in(
        "70% Vosges (88) + 20% Meurthe-et-Moselle (54) + 10% Espagne"
    ) == {"88": 70.0, "54": 20.0, "Espagne": 10.0}


def test_it_reads_a_percentage_written_after_the_place():
    # The whole string has to be read the same way round, or the last 33% would
    # have no place left to belong to.
    assert orientation_of("Ex : 88-34%, 67-33%, 68-33%") == ORIENTATION_PRECEDES
    assert shares_in("Ex : 88-34%, 67-33%, 68-33%") == {
        "88": 34.0,
        "67": 33.0,
        "68": 33.0,
    }


def test_it_reads_the_separators_the_plans_use():
    assert shares_in("60% 57 / 20% 54 / 20% 55") == {"57": 60.0, "54": 20.0, "55": 20.0}
    assert shares_in("50% - 08 / 25% - 55 / 25% - 51") == {
        "08": 50.0,
        "55": 25.0,
        "51": 25.0,
    }
    assert shares_in("50% (10) - 50% (52)") == {"10": 50.0, "52": 50.0}


def test_it_finds_no_share_when_the_cell_only_lists_places():
    assert shares_in("88,68") == {}
    assert find_percentages(normalize("88,68")) == []


def test_a_distance_is_not_a_share():
    assert find_percentages(normalize("100 km autour de l'installation")) == []


def test_it_reads_a_decimal_share():
    assert shares_in("66,5% Vosges (88) / 33,5% Espagne") == {
        "88": 66.5,
        "Espagne": 33.5,
    }


def test_a_share_whose_place_is_unreadable_is_kept_aside():
    # "50% France" names no place the domain can hold, so its share is left
    # over — which is how the cell gets flagged rather than silently halved.
    text = normalize("50%France, 50% Allemagne")
    pairing = pair_percentages_with_mentions(
        find_location_mentions(text, REFERENCE_DATA), find_percentages(text)
    )

    assert shares_in("50%France, 50% Allemagne") == {"Allemagne": 50.0}
    assert [percentage.value for percentage in pairing.unpaired] == [50.0]


def test_a_place_with_no_share_gets_none():
    # "dpt 54" is the boiler's department. The only share goes to the Vosges,
    # and the 54 is left without one.
    assert shares_in(
        "Ex nomenclature ; 100 km autour de la chaufferie dpt 54 100% Vosges"
    ) == {"88": 100.0}


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


### The whole reading, on the strings the plans actually contain


def distribution_of(raw: str | None) -> dict[str, float]:
    return {
        entry.get("code") or entry.get("libelle", ""): entry["percentage"]
        for entry in transform_provenance_data(raw, REFERENCE_DATA)["distribution"]
    }


def status_of(raw: str | None) -> str:
    return transform_provenance_data(raw, REFERENCE_DATA)["status"]


def test_bare_codes_are_split_evenly():
    assert distribution_of("88,68") == {"88": 50.0, "68": 50.0}
    assert status_of("88,68") == EVEN_SPLIT


def test_names_codes_and_a_country():
    raw = "70% Vosges (88) + 20% Meurthe-et-Moselle (54) + 10% Espagne"

    assert distribution_of(raw) == {"88": 70.0, "54": 20.0, "Espagne": 10.0}
    assert status_of(raw) == EXPLICIT


def test_the_separators_the_plans_use():
    assert distribution_of("60% 57 / 20% 54 / 20% 55") == {
        "57": 60.0,
        "54": 20.0,
        "55": 20.0,
    }
    assert distribution_of("50% - 08 / 25% - 55 / 25% - 51") == {
        "08": 50.0,
        "55": 25.0,
        "51": 25.0,
    }
    assert distribution_of("50% (10) - 50% (52)") == {"10": 50.0, "52": 50.0}
    assert status_of("50% (10) - 50% (52)") == EXPLICIT


def test_a_share_written_after_its_place():
    raw = "Ex : 88-34%, 67-33%, 68-33%"

    assert distribution_of(raw) == {"88": 34.0, "67": 33.0, "68": 33.0}
    assert status_of(raw) == EXPLICIT


def test_a_region_names_no_department():
    # Which départements the Grand Est gathers is held in Grist, not here, and
    # spreading a tonnage over ten of them would invent a precision the document
    # never had.
    assert distribution_of("GRAND EST") == {}
    assert status_of("GRAND EST") == UNRESOLVED
    assert transform_provenance_data("GRAND EST", REFERENCE_DATA)["unrecognized"] == [
        "grand est"
    ]


def test_a_distribution_written_by_region_is_reported_whole():
    raw = "60% Grand Est, 20% Hauts de France, 10% Ile de France, 10% Bourgogne Franch-Comté"
    result = transform_provenance_data(raw, REFERENCE_DATA)

    assert result["distribution"] == []
    assert result["status"] == UNRESOLVED
    assert "grand est" in result["unrecognized"]
    assert "hauts de france" in result["unrecognized"]
    assert "ile de france" in result["unrecognized"]


def test_a_former_region_is_a_region_too():
    # "100% Alsace (68)" — plans still name the régions of before 2016.
    result = transform_provenance_data("100% Alsace (68)", REFERENCE_DATA)

    assert result["unrecognized"] == ["alsace"]


def test_a_radius_names_no_department():
    assert distribution_of("100 km autour de l'installation") == {}
    assert status_of("100 km autour de l'installation") == UNRESOLVED


def test_a_radius_alongside_a_real_share():
    raw = "100 km autour de l'installation ou 100 % Vosges (88)"

    assert distribution_of(raw) == {"88": 100.0}
    assert status_of(raw) == EXPLICIT


def test_the_boiler_department_is_flagged_not_counted():
    raw = "Ex nomenclature ; 100 km autour de la chaufferie dpt 54 100% Vosges"
    result = transform_provenance_data(raw, REFERENCE_DATA)

    assert distribution_of(raw) == {"88": 100.0}
    assert result["status"] == NEEDS_REVIEW
    assert result["unrecognized"] == ["54"]


def test_a_share_of_france_is_flagged_not_absorbed():
    # The missing half must not be handed to Germany: 50% of this fuel is not
    # German, it is unaccounted for.
    raw = "50%France, 50% Allemagne"
    result = transform_provenance_data(raw, REFERENCE_DATA)

    assert result["status"] == NEEDS_REVIEW
    assert result["unrecognized"] == ["50%", "france"]
    assert distribution_of(raw) == {"Allemagne": 100.0}


def test_an_empty_cell():
    for raw in ["", None, "   "]:
        assert distribution_of(raw) == {}
        assert status_of(raw) == UNRESOLVED


### How the shares are settled


def test_shares_always_add_up_to_one_hundred():
    for raw in [
        "88,68",
        "70% Vosges (88) + 20% Meurthe-et-Moselle (54) + 10% Espagne",
        "Ex : 88-34%, 67-33%, 68-33%",
        "88, 68, 55",
        "33% 88 / 33% 68 / 33% 54",
    ]:
        distribution = distribution_of(raw)

        assert sum(distribution.values()) == pytest.approx(100.0), raw


def test_a_rounded_total_is_still_read_as_explicit():
    # 99 is how "a third each" gets written. Scaled back to 100, but not flagged.
    assert status_of("33% 88 / 33% 68 / 33% 54") == EXPLICIT
    assert distribution_of("33% 88 / 33% 68 / 33% 54")["88"] == pytest.approx(100 / 3)


def test_a_total_that_is_not_a_rounding_error_is_flagged():
    assert status_of("80% 88 / 80% 68") == NEEDS_REVIEW
    assert distribution_of("80% 88 / 80% 68") == {"88": 50.0, "68": 50.0}


def test_places_left_bare_take_what_is_missing_from_one_hundred():
    assert distribution_of("60% 88, 68, 54") == {"88": 60.0, "68": 20.0, "54": 20.0}
    assert status_of("60% 88, 68, 54") == NEEDS_REVIEW


def test_a_place_named_twice_keeps_one_share():
    assert distribution_of("50% Vosges (88) / 50% Haut-Rhin (68)") == {
        "88": 50.0,
        "68": 50.0,
    }


def test_an_unread_word_downgrades_an_otherwise_clean_reading():
    assert status_of("50% 88 / 50% 68") == EXPLICIT
    assert status_of("50% 88 / 50% 68 / le reste ailleurs") == NEEDS_REVIEW
