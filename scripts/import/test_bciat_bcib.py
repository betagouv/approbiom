from bciat_bcib import main
from provenance.reference_data import build_reference_data
from provenance.transform_provenance_data import UNRESOLVED, transform_provenance_data


def test_main_returns_2_when_no_argument():
    assert main([]) == 2

def test_main_explains_how_to_call_it_when_no_argument(capsys):
    main([])

    sortie = capsys.readouterr().out
    assert 'Missing argument' in sortie


### TODO: it should extract the correct number of data lines

### TODO: it should throw if the workbook structure is incorrect

### TODO: Les données de sorties sont correctes, par exemple ce qui est appelé Fournisseur correspond bien à la donnée du fournisseur, etc.

def test_it_reads_nothing_out_of_an_empty_value():
    result = transform_provenance_data('', build_reference_data({}, {}))

    assert result['distribution'] == []
    assert result['status'] == UNRESOLVED
