import { useState } from 'react'
import DataTable, {
    type Column,
} from '@shared/user-interface/component/DataTable'
import './Ressource.css'
import type { ApprovisionnementByPlanAndRessource } from '@shared/application/read-models/approvisionnement-by-plan-and-ressource'
import type { ApprovisionnementByPlanRessourceAndDepartementDeProvenance } from '@shared/application/read-models/approvisionnement-by-plan-ressource-and-departement-de-provenance'
import type { ApprovisionnementByPlanRessourceAndFournisseur } from '@shared/application/read-models/approvisionnement-by-plan-ressource-and-fournisseur'
import type { ApprovisionnementByPlanRessourceAndRegion } from '@shared/application/read-models/approvisionnement-by-plan-ressource-and-region'
import type { Plan } from '@shared/application/read-models/plan'
import type { RessourceScreen } from './load-ressource'
import type { Ressource } from '@shared/application/domain/ressource'

const REPARTITION = new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    maximumFractionDigits: 1,
})

/**
 * The two columns every breakdown ends with. All four aggregates extend the
 * plan+ressource total, so the measures are written once and the tables differ
 * only by the dimension they lead with.
 */
function measureColumns<
    T extends ApprovisionnementByPlanAndRessource,
>(): readonly Column<T>[] {
    return [
        {
            id: 'total',
            header: 'Total (en tonnes de matière verte / an)',
            render: (row) => row.sumTonnageTotal ?? '—',
        },
        {
            id: 'repartition',
            header: 'Répartition',
            render: (row) =>
                row.repartition === undefined
                    ? '—'
                    : REPARTITION.format(row.repartition),
        },
    ]
}

export type RessourceProps = RessourceScreen & {
    plan: Plan['id']
}

export default function Ressource({
    plan,
    totals,
    byRegion,
    byFournisseur,
    byDepartementDeProvenance,
    ressourceTitles,
    fournisseurNames,
    departementNames,
}: RessourceProps) {
    const ressourceTitle = (code: string) => ressourceTitles.get(code) ?? code

    const ressourceRows = totals.filter(
        (row) => row.planDApprovisionnement === plan
    )

    // The screen opens on the plan's first ressource rather than on nothing.
    // The three ventilations under the table are what the screen is for, and
    // starting empty makes the reader click before it shows any of it — while
    // the first ressource is a reading that is never wrong to offer.
    //
    // Only the opening value. Deselecting still empties the screen, and a plan
    // with no ressource still opens on nothing.
    //
    // Read once, at mount, which is enough: the plan being read cannot change
    // under this component. `RechercheDePlan` keys it by plan, so picking
    // another one mounts another component, opening on its own first ressource.
    const [selectedRessource, setSelectedRessource] = useState<
        Ressource['code'] | null
    >(() => ressourceRows[0]?.ressource ?? null)

    const ressourceTotal = ressourceRows.reduce(
        (sum, row) => sum + (row.sumTonnageTotal ?? 0),
        0
    )

    // The three breakdowns all narrow to the same (plan, ressource).
    const matchesSelection = (row: ApprovisionnementByPlanAndRessource) =>
        row.planDApprovisionnement === plan &&
        row.ressource === selectedRessource

    const ressourceColumns: readonly Column<ApprovisionnementByPlanAndRessource>[] =
        [
            {
                id: 'ressource',
                header: 'Ressource',
                render: (row) => ressourceTitle(row.ressource),
            },
            ...measureColumns<ApprovisionnementByPlanAndRessource>(),
        ]

    const regionColumns: readonly Column<ApprovisionnementByPlanRessourceAndRegion>[] =
        [
            {
                id: 'region',
                header: 'Région',
                render: (row) => row.region || '—',
            },
            ...measureColumns<ApprovisionnementByPlanRessourceAndRegion>(),
        ]

    const departementColumns: readonly Column<ApprovisionnementByPlanRessourceAndDepartementDeProvenance>[] =
        [
            {
                id: 'departement',
                header: 'Département de provenance',
                render: (row) =>
                    departementNames.get(row.departementDeProvenance) ||
                    row.departementDeProvenance ||
                    '—',
            },
            ...measureColumns<ApprovisionnementByPlanRessourceAndDepartementDeProvenance>(),
        ]

    const fournisseurColumns: readonly Column<ApprovisionnementByPlanRessourceAndFournisseur>[] =
        [
            {
                id: 'fournisseur',
                header: 'Fournisseur',
                render: (row) =>
                    fournisseurNames.get(row.fournisseur) ||
                    row.fournisseur ||
                    '—',
            },
            ...measureColumns<ApprovisionnementByPlanRessourceAndFournisseur>(),
        ]

    return (
        // The blocks are spaced by the stylesheet rather than by a top margin
        // on each: what sits above the screen is the caller's, and a leading
        // margin of ours would push against it.
        <div className="ressource">
            <div>
                <DataTable
                    caption="Ressources du plan sélectionné"
                    rows={ressourceRows}
                    columns={ressourceColumns}
                    bordered
                    selectedRows={ressourceRows.filter(
                        (row) => row.ressource === selectedRessource
                    )}
                    onSelectionChange={(rows) =>
                        setSelectedRessource(
                            rows.find(
                                (row) => row.ressource !== selectedRessource
                            )?.ressource ?? null
                        )
                    }
                    selectionLabel={(row) =>
                        `Sélectionner la ressource ${ressourceTitle(row.ressource)}`
                    }
                />
                <p className="ressource__total fr-mt-1w">
                    <strong>
                        Total : {ressourceTotal.toLocaleString('fr-FR')} tonnes
                        de matières vertes / an
                    </strong>
                </p>
            </div>

            {selectedRessource !== null && (
                <>
                    <DataTable
                        caption="Ventilation par région"
                        rows={byRegion.filter(matchesSelection)}
                        columns={regionColumns}
                        bordered
                    />

                    <DataTable
                        caption="Ventilation par département"
                        rows={byDepartementDeProvenance.filter(
                            matchesSelection
                        )}
                        columns={departementColumns}
                        bordered
                    />

                    <DataTable
                        caption="Ventilation par fournisseur"
                        rows={byFournisseur.filter(matchesSelection)}
                        columns={fournisseurColumns}
                        bordered
                    />
                </>
            )}
        </div>
    )
}
