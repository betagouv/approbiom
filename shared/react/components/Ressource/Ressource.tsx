import { useState } from 'react'
import DataTable, { type Column } from '@shared/react/components/DataTable'
import './Ressource.css'
import type {
    Group,
    ApprovisionnementStats,
    ApprovisionnementStatsByRessource,
} from '@shared/core/application/services/approvisionnement-stats'
import type { Ressource } from '@shared/core/domain/entities/ressource'

const REPARTITION = new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    maximumFractionDigits: 1,
})

function measureColumns<
    T extends { tonnageTotal: number; repartition: number },
>(): readonly Column<T>[] {
    return [
        {
            id: 'total',
            header: 'Total (en tonnes de matière verte / an)',
            render: (row) => row.tonnageTotal,
        },
        {
            id: 'repartition',
            header: 'Répartition',
            render: (row) => REPARTITION.format(row.repartition),
        },
    ]
}

function groupColumns(header: string): readonly Column<Group>[] {
    return [
        {
            id: 'label',
            header,
            render: (row) => row.label,
        },
        ...measureColumns<Group>(),
    ]
}

export type RessourceProps = ApprovisionnementStats

export default function Ressource({
    tonnageTotal,
    byRessource,
}: RessourceProps) {
    const [selectedCode, setSelectedCode] = useState<Ressource['code'] | null>(
        () => byRessource[0]?.ressource.code ?? null
    )

    const selected =
        byRessource.find(({ ressource }) => ressource.code === selectedCode) ??
        null

    const ressourceColumns: readonly Column<ApprovisionnementStatsByRessource>[] =
        [
            {
                id: 'ressource',
                header: 'Ressource',
                render: (row) => row.ressource.title,
            },
            ...measureColumns<ApprovisionnementStatsByRessource>(),
        ]

    return (
        // The blocks are spaced by the stylesheet rather than by a top margin
        // on each: what sits above the screen is the caller's, and a leading
        // margin of ours would push against it.
        <div className="ressource">
            <div>
                <DataTable
                    caption="Ressources du plan sélectionné"
                    rows={byRessource}
                    columns={ressourceColumns}
                    bordered
                    selectedRows={byRessource.filter(
                        ({ ressource }) => ressource.code === selectedCode
                    )}
                    onSelectionChange={(rows) =>
                        setSelectedCode(
                            rows.find(
                                ({ ressource }) =>
                                    ressource.code !== selectedCode
                            )?.ressource.code ?? null
                        )
                    }
                    selectionLabel={(row) =>
                        `Sélectionner la ressource ${row.ressource.title}`
                    }
                />
                <p className="ressource__total fr-mt-1w">
                    <strong>
                        Total : {tonnageTotal.toLocaleString('fr-FR')} tonnes de
                        matières vertes / an
                    </strong>
                </p>
            </div>

            {selected !== null && (
                <>
                    <DataTable
                        caption="Ventilation par région"
                        rows={selected.byRegion}
                        columns={groupColumns('Région')}
                        bordered
                    />

                    <DataTable
                        caption="Ventilation par département"
                        rows={selected.byDepartement}
                        columns={groupColumns('Département de provenance')}
                        bordered
                    />

                    <DataTable
                        caption="Ventilation par fournisseur"
                        rows={selected.byFournisseur}
                        columns={groupColumns('Fournisseur')}
                        bordered
                    />
                </>
            )}
        </div>
    )
}
