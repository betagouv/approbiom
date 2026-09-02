from pathlib import Path

from openpyxl import load_workbook

from bciat_bcib import (
    NAME_COL_DATA_CONFIDENCE,
    NAME_COL_DOCUMENT,
    NAME_COL_FOURNISSEUR,
    NAME_COL_PROVENANCE,
    NAME_COL_RAW_PROVENANCE,
    NAME_COL_RESSOURCE,
    NAME_COL_ROW,
    NAME_COL_TONNAGE,
    SHEET_NAME,
    extract_data_from_worksheet,
    main,
)
from provenance.reference_data import build_reference_data, load_reference_data
from provenance.transform_provenance_data import UNRESOLVED, transform_provenance_data

TEST_WORKBOOK = Path(__file__).parent / "BCIAT_test_Plan_dapprovisionnement.xlsx"


def test_main_returns_2_when_no_argument():
    assert main([]) == 2


def test_main_explains_how_to_call_it_when_no_argument(capsys):
    main([])

    sortie = capsys.readouterr().out
    assert "Missing argument" in sortie


def test_it_extracts_one_row_per_line_with_every_column_in_its_place():
    """The whole row is asserted at once, on purpose.

    Comparing the dictionary itself is what proves that no column was read off
    the wrong index — a "Tonnage" holding the PCI would pass any check that only
    counts rows or looks at keys.
    """
    workbook = load_workbook(TEST_WORKBOOK, read_only=True, data_only=True)

    data = extract_data_from_worksheet(
        TEST_WORKBOOK.name, workbook[SHEET_NAME], load_reference_data()
    )

    assert len(data) == 6

    assert data[0] == {
        NAME_COL_DOCUMENT: TEST_WORKBOOK.name,
        NAME_COL_ROW: 19,
        NAME_COL_FOURNISSEUR: "SANGUINET BOIS",
        NAME_COL_RESSOURCE: "Plaquettes forestières (référentiel 2017 - 1A - PFA)",
        NAME_COL_TONNAGE: 20762,
        NAME_COL_PROVENANCE: [],
        NAME_COL_DATA_CONFIDENCE: UNRESOLVED,
        NAME_COL_RAW_PROVENANCE: "100 km autour de l'installation",
    }

    # The last line too, so that the end of the table is found where it is and
    # not one row short or one row into the blanks below.
    assert data[-1][NAME_COL_FOURNISSEUR] == "GBF SERVICES"
    assert data[-1][NAME_COL_TONNAGE] == 3585
    assert data[-1][NAME_COL_ROW] == 24


def test_it_reads_nothing_out_of_an_empty_value():
    result = transform_provenance_data("", build_reference_data({}, {}))

    assert result["distribution"] == []
    assert result["status"] == UNRESOLVED
