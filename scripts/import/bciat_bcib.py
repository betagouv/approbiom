# Le but de ce script est d'extraire les informations d'un document BCIAT
# Pour remplir la table Approvisionnement.

import sys
import os
from openpyxl import load_workbook, Workbook
from openpyxl.worksheet.worksheet import Worksheet

# Workbook structure
SHEET_NAME = "Fournisseurs"
INDEX_ROW_HEADERS = 18
POSITION_HEADER_COLUMN_FOURNISSEURS = "A18"
HEADER_COLUMN_FOURNISSEURS = "Fournisseur"

INDEX_COL_FOURNISSEURS = 0
INDEX_COL_RESSOURCE = 2
INDEX_COL_TONNAGE = 3
INDEX_COL_PROVENANCE = 10

# Result format
NAME_COL_FOURNISSEUR = "Fournisseur"
NAME_COL_RESSOURCE = "Ressource"
NAME_COL_TONNAGE = "Tonnage"
NAME_COL_PROVENANCE = "Provenance"


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


def check_workbook_structure(wb: Workbook) -> None:
    sheetnames = wb.sheetnames

    if SHEET_NAME not in sheetnames:
        raise MyError(f'The sheet "{SHEET_NAME}" does not exist in the file.')
    ws = wb[SHEET_NAME]

    if (ws[POSITION_HEADER_COLUMN_FOURNISSEURS].value) != HEADER_COLUMN_FOURNISSEURS:
        raise MyError(
            f'The cell {POSITION_HEADER_COLUMN_FOURNISSEURS} of the sheet "{SHEET_NAME}" '
            f'should be the header "{HEADER_COLUMN_FOURNISSEURS}".'
        )


def find_index_last_row_data(ws: Worksheet) -> int:
    # The last row of data is the row where the first Column ("Fournisseur") is None
    for row in range(INDEX_ROW_HEADERS + 1, ws.max_row + 1):
        if ws.cell(row=row, column=1).value is None:
            return row - 1

    return ws.max_row


def extract_data_from_worksheet(ws: Worksheet) -> list[dict[str, str]]:
    extract_data = []

    index_last_row = find_index_last_row_data(ws)
    rows = list(
        ws.iter_rows(
            min_row=INDEX_ROW_HEADERS + 1,
            max_row=index_last_row,
            min_col=INDEX_COL_FOURNISSEURS,
            values_only=True,
        )
    )
    for row in rows:
        extract_data.append(
            {
                NAME_COL_FOURNISSEUR: row[INDEX_COL_FOURNISSEURS],
                NAME_COL_RESSOURCE: row[INDEX_COL_RESSOURCE],
                NAME_COL_TONNAGE: row[INDEX_COL_TONNAGE],
                NAME_COL_PROVENANCE: row[INDEX_COL_PROVENANCE],
            }
        )

    return extract_data


def main(argv: list[str]) -> int:
    if len(argv) != 1:
        print("Missing argument: you need to provide the path of a file.")
        print("Example: python3 bciat_bcib.py example.xlsx")
        return 2
    path = argv[0]

    try:
        check_path_exists(path)
        check_file_is_xlsx(path)
        wb = load_workbook(path, read_only=True)
        check_workbook_structure(wb)
        ws = wb[SHEET_NAME]
        data = extract_data_from_worksheet(ws)
        print(data)

    except MyError as e:
        print(e)
        return 2

    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
