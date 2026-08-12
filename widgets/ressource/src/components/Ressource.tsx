import { useState } from 'react'
import SearchBar from '@shared/components/SearchBar'
import DataTable, { type Column } from '@shared/components/DataTable'
import './Ressource.css'
import type { ApprovisionnementByPlanAndRessource } from '@shared/application/read-models/approvisionnement-by-plan-and-ressource'
import type { ApprovisionnementByPlanRessourceAndDepartementDeProvenance } from '@shared/application/read-models/approvisionnement-by-plan-ressource-and-departement-de-provenance'
import type { ApprovisionnementByPlanRessourceAndFournisseur } from '@shared/application/read-models/approvisionnement-by-plan-ressource-and-fournisseur'
import type { ApprovisionnementByPlanRessourceAndRegion } from '@shared/application/read-models/approvisionnement-by-plan-ressource-and-region'
import type { RessourceScreen } from '../load-ressource'

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

export default function Ressource({
    plans,
    totals,
    byRegion,
    byFournisseur,
    byDepartementDeProvenance,
    ressourceTitles,
    fournisseurNames,
    departementNames,
}: RessourceScreen) {
    const [selectedPlan, setSelectedPlan] = useState<number | null>(null)
    // The ressource's code, not the row it came from: rows are rebuilt on every
    // load, so identity is not something a selection can be pinned to.
    const [selectedRessource, setSelectedRessource] = useState<string | null>(
        null
    )

    const planOptions = plans.map((plan) => ({
        value: plan.id,
        label: plan.nom || `Plan ${plan.id}`,
    }))

    const ressourceTitle = (code: string) => ressourceTitles.get(code) ?? code

    const ressourceRows = totals.filter(
        (row) => row.planDApprovisionnement === selectedPlan
    )

    const ressourceTotal = ressourceRows.reduce(
        (sum, row) => sum + (row.sumTonnageTotal ?? 0),
        0
    )

    // The three breakdowns all narrow to the same selected (plan, ressource).
    const matchesSelection = (row: ApprovisionnementByPlanAndRessource) =>
        row.planDApprovisionnement === selectedPlan &&
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
        <div className="fr-p-2w">
            <SearchBar
                label="Rechercher un plan d’approvisionnement"
                placeholder="Rechercher un plan d’approvisionnement"
                options={planOptions}
                onSelect={(planId) => {
                    setSelectedPlan(planId)
                    setSelectedRessource(null)
                }}
            />

            {selectedPlan !== null && (
                <div className="fr-mt-4w">
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
                            Total : {ressourceTotal.toLocaleString('fr-FR')}{' '}
                            tonnes de matières vertes / an
                        </strong>
                    </p>
                </div>
            )}

            {selectedRessource !== null && (
                <>
                    <div className="fr-mt-4w">
                        <DataTable
                            caption="Ventilation par région"
                            rows={byRegion.filter(matchesSelection)}
                            columns={regionColumns}
                            bordered
                        />
                    </div>

                    <div className="fr-mt-4w">
                        <DataTable
                            caption="Ventilation par département"
                            rows={byDepartementDeProvenance.filter(
                                matchesSelection
                            )}
                            columns={departementColumns}
                            bordered
                        />
                    </div>

                    <div className="fr-mt-4w">
                        <DataTable
                            caption="Ventilation par fournisseur"
                            rows={byFournisseur.filter(matchesSelection)}
                            columns={fournisseurColumns}
                            bordered
                        />
                    </div>
                </>
            )}
        </div>
    )
}
