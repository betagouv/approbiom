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
