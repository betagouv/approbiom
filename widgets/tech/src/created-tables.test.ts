import { describe, expect, it } from 'vitest'
import { findCreatedTables } from './created-tables'

const comparison = {
    details: {
        rightChanges: {
            tableDeltas: {
                _grist_Tables: {
                    addRows: [105],
                    columnDeltas: {
                        tableId: { 105: [null, ['Nouvelle_table']] },
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
            },
        },
    },
}

describe('findCreatedTables', () => {
    it('lists the tables added to _grist_Tables with their own columns', () => {
        expect(findCreatedTables(comparison)).toEqual([
            {
                tableId: 'Nouvelle_table',
                columns: [
                    { colId: 'Nom', type: 'Text' },
                    { colId: 'Fournisseur', type: 'Ref:Entreprise' },
                ],
            },
        ])
    })

    it('finds nothing when _grist_Tables did not change', () => {
        expect(
            findCreatedTables({
                details: { rightChanges: { tableDeltas: {} } },
            })
        ).toEqual([])
    })
})
