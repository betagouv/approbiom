import DataTable from '@shared/react/components/DataTable'
import type { Column } from '@shared/react/components/DataTable'
import {
    findAddedColumnInTables,
    findAddedTablesFromTableDeltas,
    findUpdatedColumnInTables,
    type AddedColumn,
    type AddedColumnInfo,
    type ColumnChange,
    type UpdatedColumnInfo,
} from '../comparison-analysis'
import type { ResultCompareVersion } from '../types/compare-version'

const COLUMNS: Column<AddedColumn>[] = [
    {
        id: 'colId',
        header: 'Nom de la colonne',
        render: ({ colId }) => <code>{colId}</code>,
    },
    {
        id: 'type',
        header: 'Type de la colonne',
        render: ({ type }) => <code>{type}</code>,
    },
]

const ADDED_COLUMN_COLUMNS: Column<AddedColumnInfo>[] = [
    {
        id: 'colId',
        header: 'Nom de la colonne',
        render: ({ colId }) => <code>{colId}</code>,
    },
    {
        id: 'label',
        header: 'Libellé',
        render: ({ label }) => label,
    },
    {
        id: 'type',
        header: 'Type',
        render: ({ colInfo }) => <code>{colInfo.type}</code>,
    },
    {
        id: 'isFormula',
        header: 'Colonne formule',
        render: ({ colInfo }) => (colInfo.isFormula ? 'Oui' : 'Non'),
    },
    {
        id: 'formula',
        header: 'Formule',
        render: ({ colInfo }) => <code>{colInfo.formula}</code>,
    },
    {
        id: 'widgetOptions',
        header: 'Options (widgetOptions)',
        render: ({ colInfo }) => <code>{colInfo.widgetOptions}</code>,
    },
    {
        id: 'description',
        header: 'Description',
        render: ({ colInfo }) => colInfo.description,
    },
    {
        id: 'recalcDeps',
        header: 'Dépendances de recalcul (recalcDeps)',
        render: ({ colInfo }) => (
            <code>{colInfo.recalcDeps?.join(', ') ?? ''}</code>
        ),
    },
]

type ColumnChangeRow = ColumnChange &
    Pick<UpdatedColumnInfo, 'colRef' | 'colId'>

function formatCellValue(value: unknown): string {
    return typeof value === 'string' ? value : JSON.stringify(value)
}

const COLUMN_CHANGE_COLUMNS: Column<ColumnChangeRow>[] = [
    {
        id: 'column',
        header: 'Colonne',
        render: ({ colRef, colId }) => <code>{colId ?? `n° ${colRef}`}</code>,
    },
    {
        id: 'property',
        header: 'Propriété',
        render: ({ property }) => <code>{property}</code>,
    },
    {
        id: 'before',
        header: 'Avant',
        render: ({ before }) => <code>{formatCellValue(before)}</code>,
    },
    {
        id: 'after',
        header: 'Après',
        render: ({ after }) => <code>{formatCellValue(after)}</code>,
    },
]

export default function ResultView({ comparison }: { comparison: unknown }) {
    const rightTableDeltas =
        (comparison as ResultCompareVersion).details?.rightChanges
            ?.tableDeltas ?? {}
    const rightAddedTables = findAddedTablesFromTableDeltas(rightTableDeltas)
    const rightAddedColumns = findAddedColumnInTables(rightTableDeltas)
    const rightUpdatedColumns = findUpdatedColumnInTables(rightTableDeltas)

    return (
        <section className="fr-mt-4w comparison-result">
            <h2 className="fr-h4 fr-mb-1w">
                Changements de l&apos;état d&apos;arrivée
            </h2>
            <section className="fr-mt-4w">
                <h3 className="fr-h5 fr-mb-1w">Les tables créées</h3>
                {rightAddedTables.length === 0 && <p>Aucune table créée.</p>}
                {rightAddedTables.map(({ tableId, label, columns }) => (
                    <DataTable
                        key={tableId}
                        caption={label}
                        description={
                            label === tableId
                                ? undefined
                                : `tableId : ${tableId}`
                        }
                        rows={columns}
                        columns={COLUMNS}
                        bordered
                    />
                ))}
            </section>
            <section className="fr-mt-4w">
                <h3 className="fr-h5 fr-mb-1w">Colonnes ajoutées</h3>
                {rightAddedColumns.size === 0 && <p>Aucune colonne ajoutée.</p>}
                {[...rightAddedColumns].map(([tableId, columns]) => (
                    <DataTable
                        key={tableId}
                        caption={tableId}
                        rows={columns}
                        columns={ADDED_COLUMN_COLUMNS}
                        bordered
                        multiLine
                    />
                ))}
            </section>
            <section className="fr-mt-4w">
                <h3 className="fr-h5 fr-mb-1w">Colonnes modifiées</h3>
                {rightUpdatedColumns.size === 0 && (
                    <p>Aucune colonne modifiée.</p>
                )}
                {[...rightUpdatedColumns].map(([tableId, columns]) => (
                    <DataTable
                        key={tableId}
                        caption={tableId}
                        rows={columns.flatMap(({ colRef, colId, changes }) =>
                            changes.map((change) => ({
                                colRef,
                                colId,
                                ...change,
                            }))
                        )}
                        columns={COLUMN_CHANGE_COLUMNS}
                        bordered
                        multiLine
                    />
                ))}
            </section>
        </section>
    )
}
