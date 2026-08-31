from provenance.transform_provenance_data import get_french_departments_from_string

DEPARTEMENTS_DE_TEST = {
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


def test_numbers_with_comma():
    assert get_french_departments_from_string(
        "88,68,67,69,52,54,55,57,90,70", DEPARTEMENTS_DE_TEST
    ) == ["88", "68", "67", "69", "52", "54", "55", "57", "90", "70"]
