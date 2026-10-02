import { describe, expect, it } from 'vitest'
import {
    findAddedColumnInTables,
    findAddedTablesFromTableDeltas,
    findUpdatedColumnInTables,
    UNKNOWN_TABLE_ID,
} from './comparison-analysis'
import type { TableDeltas } from './types/compare-version'

const tableDeltas: TableDeltas = {
    _grist_Tables: {
        addRows: [105],
        columnDeltas: {
            tableId: { 105: [null, ['Nouvelle_table']] },
            rawViewSectionRef: { 105: [[0], [502]] },
        },
    },
    _grist_Views_section: {
        addRows: [502],
        columnDeltas: {
            title: { 502: [null, ['Nouvelle table']] },
        },
    },
    _grist_Tables_column: {
        addRows: [1, 2, 3],
        columnDeltas: {
            parentId: {
                1: [null, [105]],
                2: [null, [105]],
                3: [null, [81]],
            },
            colId: {
                1: [null, ['Nom']],
                2: [null, ['Fournisseur']],
                3: [null, ['Source']],
            },
            type: {
                1: [null, ['Text']],
                2: [null, ['Ref:Entreprise']],
                3: [null, ['Ref:Piece_jointe']],
            },
        },
    },
}

describe('findAddedTablesFromTableDeltas', () => {
    it('lists the tables added to _grist_Tables with their own columns', () => {
        expect(findAddedTablesFromTableDeltas(tableDeltas)).toEqual([
            {
                tableId: 'Nouvelle_table',
                label: 'Nouvelle table',
                columns: [
                    { colId: 'Nom', type: 'Text' },
                    { colId: 'Fournisseur', type: 'Ref:Entreprise' },
                ],
            },
        ])
    })

    it('labels a table by its tableId when its raw data section has no title', () => {
        const [table] = findAddedTablesFromTableDeltas({
            _grist_Tables: {
                addRows: [105],
                columnDeltas: {
                    tableId: { 105: [null, ['Nouvelle_table']] },
                },
            },
        })
        expect(table.label).toBe('Nouvelle_table')
    })

    it('finds nothing when _grist_Tables did not change', () => {
        expect(findAddedTablesFromTableDeltas({})).toEqual([])
    })
})

describe('findAddedColumnInTables', () => {
    it('groups the added columns by the tableId of their table', () => {
        const addedColumns = findAddedColumnInTables({
            _grist_Tables: {
                addRows: [105],
                columnDeltas: {
                    tableId: { 105: [null, ['Nouvelle_table']] },
                },
            },
            _grist_Tables_column: {
                addRows: [1, 2],
                columnDeltas: {
                    parentId: { 1: [null, [105]], 2: [null, [81]] },
                    colId: { 1: [null, ['Nom']], 2: [null, ['Source']] },
                    type: {
                        1: [null, ['Text']],
                        2: [null, ['Ref:Piece_jointe']],
                    },
                    isFormula: { 1: [null, [true]], 2: [null, [false]] },
                    formula: { 1: [null, ['$Fournisseur.Nom']] },
                    label: { 1: [null, ['Nom']], 2: [null, ['Source']] },
                    widgetOptions: { 2: [null, ['{"widget":"Reference"}']] },
                    description: { 2: [null, ['Document importé']] },
                    recalcDeps: { 2: [null, [['L', 1157]]] },
                },
            },
            Approvisionnement: {
                addRows: [],
                columnRenames: [[null, 'Source']],
                columnDeltas: {},
            },
        })

        expect(addedColumns).toEqual(
            new Map([
                [
                    'Nouvelle_table',
                    [
                        {
                            colId: 'Nom',
                            colInfo: {
                                type: 'Text',
                                isFormula: true,
                                formula: '$Fournisseur.Nom',
                                widgetOptions: '',
                                description: '',
                                recalcDeps: null,
                            },
                            label: 'Nom',
                        },
                    ],
                ],
                [
                    'Approvisionnement',
                    [
                        {
                            colId: 'Source',
                            colInfo: {
                                type: 'Ref:Piece_jointe',
                                isFormula: false,
                                formula: '',
                                widgetOptions: '{"widget":"Reference"}',
                                description: 'Document importé',
                                recalcDeps: [1157],
                            },
                            label: 'Source',
                        },
                    ],
                ],
            ])
        )
    })

    it('finds nothing when no column was added', () => {
        expect(findAddedColumnInTables({})).toEqual(new Map())
    })
})

describe('findUpdatedColumnInTables', () => {
    it('lists what changed on columns that already existed', () => {
        const updatedColumns = findUpdatedColumnInTables({
            _grist_Tables_column: {
                addRows: [2],
                updateRows: [1502, 2],
                columnDeltas: {
                    widgetOptions: {
                        1502: [
                            ['{"choices":["France"]}'],
                            ['{"choices":["France","Portugal"]}'],
                        ],
                        2: [null, ['']],
                    },
                    formula: { 1502: ['?', ['']] },
                    recalcWhen: { 1502: [[0], [1]] },
                },
            },
        })

        expect(updatedColumns).toEqual(
            new Map([
                [
                    UNKNOWN_TABLE_ID,
                    [
                        {
                            colRef: 1502,
                            colId: undefined,
                            changes: [
                                {
                                    property: 'widgetOptions',
                                    before: '{"choices":["France"]}',
                                    after: '{"choices":["France","Portugal"]}',
                                },
                                { property: 'formula', before: '?', after: '' },
                                { property: 'recalcWhen', before: 0, after: 1 },
                            ],
                        },
                    ],
                ],
            ])
        )
    })

    it('names the column and its table when the comparison gives them', () => {
        const [[tableId, [column]]] = findUpdatedColumnInTables({
            _grist_Tables: {
                addRows: [],
                columnDeltas: {
                    tableId: {
                        81: [['Approvisionnement'], ['Approvisionnement']],
                    },
                },
            },
            _grist_Tables_column: {
                addRows: [],
                updateRows: [7],
                columnDeltas: {
                    colId: { 7: [['Ancien_nom'], ['Nouveau_nom']] },
                    parentId: { 7: [[80], [81]] },
                },
            },
        })

        expect(tableId).toBe('Approvisionnement')
        expect(column.colId).toBe('Nouveau_nom')
    })
})
