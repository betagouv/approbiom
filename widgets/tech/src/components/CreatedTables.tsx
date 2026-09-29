import DataTable from '@shared/react/components/DataTable'
import type { Column } from '@shared/react/components/DataTable'
import { findCreatedTables, type CreatedColumn } from '../created-tables'

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

export default function CreatedTables({ comparison }: { comparison: unknown }) {
    const createdTables = findCreatedTables(comparison)

    return (
        <section className="fr-mt-4w">
            <h2 className="fr-h6 fr-mb-1w">Les tables créées</h2>
            <p className="fr-text--sm fr-text-mention--grey">
                Trouvées dans <code>details.rightChanges.tableDeltas</code> :
                chaque id de <code>_grist_Tables.addRows</code> est une table
                créée, nommée par <code>columnDeltas.tableId</code>. Ses
                colonnes sont les lignes de{' '}
                <code>_grist_Tables_column.addRows</code> dont le{' '}
                <code>parentId</code> vaut cet id, avec leur <code>colId</code>{' '}
                et leur <code>type</code>.
            </p>
            {createdTables.length === 0 && <p>Aucune table créée.</p>}
            {createdTables.map(({ tableId, columns }) => (
                <DataTable
                    key={tableId}
                    caption={tableId}
                    rows={columns}
                    columns={COLUMNS}
                    bordered
                />
            ))}
        </section>
    )
}
