from bciat_bcib import main

def test_main_returns_2_when_no_argument():
    assert main([]) == 2

def test_main_explains_how_to_call_it_when_no_argument(capsys):
    main([])

    sortie = capsys.readouterr().out
    assert 'Missing argument' in sortie
