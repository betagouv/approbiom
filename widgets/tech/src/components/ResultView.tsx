import DataTable from '@shared/react/components/DataTable'
import type { Column } from '@shared/react/components/DataTable'
import {
    findCreatedTablesFromTableDeltas,
    type CreatedColumn,
} from '../created-tables'
import type { ResultCompareVersion } from '../types/compare-version'

const COLUMNS: Column<CreatedColumn>[] = [
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

export default function ResultView({ comparison }: { comparison: unknown }) {
    const rightCreatedTables = findCreatedTablesFromTableDeltas(
        (comparison as ResultCompareVersion).details?.rightChanges
            ?.tableDeltas ?? {}
    )

    return (
        <section className="fr-mt-4w">
            <h2 className="fr-h6 fr-mb-1w">
                Les tables créées dans l&apos;état d&apos;arrivée
            </h2>
            {rightCreatedTables.length === 0 && <p>Aucune table créée.</p>}
            {rightCreatedTables.map(({ tableId, label, columns }) => (
                <DataTable
                    key={tableId}
                    caption={label}
                    description={
                        label === tableId ? undefined : `tableId : ${tableId}`
                    }
                    rows={columns}
                    columns={COLUMNS}
                    bordered
                />
            ))}
        </section>
    )
}
