# Le but de ce script est d'extraire les informations d'un document BCIAT
# Pour remplir la table Approvisionnement.

import sys
import os
from openpyxl import load_workbook

SHEET_NAME = "Fournisseurs"
POSITION_HEADER_COLUMN_FOURNISSEURS = "A18"
HEADER_COLUMN_FOURNISSEURS = "Fournisseur"


class MyError(Exception):
    pass


def check_path_exists(file_path: str) -> None:
    if not os.path.exists(file_path):
        raise MyError(f"The file does not exist: {file_path}")


def check_file_is_xlsx(file_path: str) -> None:
    # splitext returns a tuple of root and extension
    file_extension = os.path.splitext(file_path)[1]

    if file_extension != ".xlsx":
        raise MyError(f"The file is not a xlsx file: {file_path}")


def check_file_structure(file_path: str) -> None:
    wb = load_workbook(file_path, read_only=True)
    # grab the active worksheet
    sheetnames = wb.sheetnames

    if SHEET_NAME not in sheetnames:
        raise MyError(f'The sheet "{SHEET_NAME}" does not exist in the file.')
    ws = wb[SHEET_NAME]

    if (ws[POSITION_HEADER_COLUMN_FOURNISSEURS].value) != HEADER_COLUMN_FOURNISSEURS:
        raise MyError(
            f'The cell {POSITION_HEADER_COLUMN_FOURNISSEURS} of the sheet "{SHEET_NAME}" '
            f'should be the header "{HEADER_COLUMN_FOURNISSEURS}".'
        )


def main(argv: list[str]) -> int:
    if len(argv) != 1:
        print("Missing argument: you need to provide the path of a file.")
        print("Example: python3 bciat_bcib.py example.xlsx")
        return 2
    path = argv[0]

    try:
        check_path_exists(path)
        check_file_is_xlsx(path)
        check_file_structure(path)
    except MyError as e:
        print(e)
        return 2

    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
