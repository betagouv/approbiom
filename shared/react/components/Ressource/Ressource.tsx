import { useState } from 'react'
import DataTable, { type Column } from '@shared/react/components/DataTable'
import './Ressource.css'
import type {
    Group,
    ApprovisionnementByRessourceStats,
    ApprovisionnementStatsByRessource,
} from '@shared/core/application/services/approvisionnement-stats'
import type { LocalizationPort } from '@shared/core/application/ports/localization'
import type { Ressource } from '@shared/core/domain/entities/ressource'
import Alert from '../Alert'
import ProvenanceMap from './ProvenanceMap'

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

export type RessourceProps = {
    approvisionnementStatsByRessource: ApprovisionnementByRessourceStats
    getDepartementContour: LocalizationPort['getDepartementContour']
    getCountryContour: LocalizationPort['getCountryContour']
}

export default function Ressource({
    approvisionnementStatsByRessource,
    getDepartementContour,
    getCountryContour,
}: RessourceProps) {
    const [selectedCode, setSelectedCode] = useState<Ressource['code'] | null>(
        () => approvisionnementStatsByRessource[0]?.ressource.code ?? null
    )

    const selected =
        approvisionnementStatsByRessource.length >= 1
            ? (approvisionnementStatsByRessource.find(
                  ({ ressource }) => ressource.code === selectedCode
              ) ?? null)
            : null

    const selectedRows =
        approvisionnementStatsByRessource.length >= 1
            ? approvisionnementStatsByRessource.filter(
                  ({ ressource }) => ressource.code === selectedCode
              )
            : undefined

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
        <div className="ressource">
            <div>
                {approvisionnementStatsByRessource.length >= 1 ? (
                    <DataTable
                        caption="Ressources du plan sélectionné"
                        rows={approvisionnementStatsByRessource}
                        columns={ressourceColumns}
                        bordered
                        selectedRows={selectedRows}
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
                ) : (
                    <Alert severity="warning">
                        Aucun approvisionnement n&apos;a été trouvé pour ce
                        plan.
                    </Alert>
                )}
                {selected && (
                    <p className="ressource__total fr-mt-1w">
                        <strong>
                            Total :{' '}
                            {selected.tonnageTotal.toLocaleString('fr-FR')}{' '}
                            tonnes de matières vertes / an
                        </strong>
                    </p>
                )}
            </div>

            {selected !== null && (
                <div className="ressource__ventilations">
                    <div className="ressource__breakdowns">
                        <DataTable
                            caption="Ventilation par provenance"
                            rows={selected.byProvenance}
                            columns={groupColumns('Provenance')}
                            bordered
                        />
                        <DataTable
                            caption="Ventilation par région ou pays"
                            rows={selected.byRegionOuPays}
                            columns={groupColumns('Région ou pays')}
                            bordered
                        />

                        <DataTable
                            caption="Ventilation par fournisseur"
                            rows={selected.byFournisseur}
                            columns={groupColumns('Fournisseur')}
                            bordered
                        />
                    </div>

                    <ProvenanceMap
                        provenances={selected.byProvenance}
                        getDepartementContour={getDepartementContour}
                        getCountryContour={getCountryContour}
                    />
                </div>
            )}
        </div>
    )
}
