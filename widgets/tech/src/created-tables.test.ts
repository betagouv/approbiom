import { describe, expect, it } from 'vitest'
import { findCreatedTablesFromTableDeltas } from './created-tables'
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

describe('findCreatedTablesFromTableDeltas', () => {
    it('lists the tables added to _grist_Tables with their own columns', () => {
        expect(findCreatedTablesFromTableDeltas(tableDeltas)).toEqual([
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
        const [table] = findCreatedTablesFromTableDeltas({
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
        expect(findCreatedTablesFromTableDeltas({})).toEqual([])
    })
})
