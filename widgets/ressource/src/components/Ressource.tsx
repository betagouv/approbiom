import { useState } from 'react'
import SearchBar from '@shared/components/SearchBar'
import DataTable, { type Column } from '@shared/components/DataTable'
import type {
    Fetched_Plan_d_approvisionnement,
    Fetched_Ressource,
    Fetched_Region,
    Fetched_Fournisseur,
    Fetched_Departement,
    Fetched_Meta_Ressource,
    Fetched_Entreprise,
} from '../grist'

type RessourceProps = {
    plans: readonly Fetched_Plan_d_approvisionnement[]
    ressources: readonly Fetched_Ressource[]
    regions: readonly Fetched_Region[]
    fournisseurs: readonly Fetched_Fournisseur[]
    departements: readonly Fetched_Departement[]
    metaRessourceById: ReadonlyMap<number, Fetched_Meta_Ressource>
    // What a summary's `Fournisseur` column points at: the supplier's row in
    // `Entreprise`, keyed by rowId.
    entrepriseById: ReadonlyMap<number, Fetched_Entreprise>
}

const REPARTITION = new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    maximumFractionDigits: 1,
})

function repartitionLabel(repartition: number | boolean | null): string {
    return typeof repartition === 'number'
        ? REPARTITION.format(repartition)
        : '—'
}

const regionColumns: readonly Column<Fetched_Region>[] = [
    {
        id: 'region',
        header: 'Région',
        // Region is a formula column typed `unknown`; render it only when it is
        // a primitive, so an unexpected object can't stringify to [object Object].
        render: (r) =>
            typeof r.Region === 'string' || typeof r.Region === 'number'
                ? r.Region
                : '—',
    },
    {
        id: 'total',
        header: 'Total (en tonnes de matière verte / an)',
        render: (r) => r.Total_en_tMv_an_ ?? '—',
    },
    {
        id: 'repartition',
        header: 'Répartition',
        render: (r) => repartitionLabel(r.Repartition),
    },
]

const departementColumns: readonly Column<Fetched_Departement>[] = [
    {
        id: 'departement',
        header: 'Département de provenance',
        render: (r) => String(r.Departement_de_provenance),
    },
    {
        id: 'total',
        header: 'Total (en tonnes de matière verte / an)',
        render: (r) => r.Total_en_tMv_an_ ?? '—',
    },
    {
        id: 'repartition',
        header: 'Répartition',
        render: (r) => repartitionLabel(r.Repartition),
    },
]

export default function Ressource({
    plans,
    ressources,
    regions,
    fournisseurs,
    departements,
    metaRessourceById,
    entrepriseById,
}: RessourceProps) {
    const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
    const [selectedRessource, setSelectedRessource] =
        useState<Fetched_Ressource | null>(null)

    // Resolve a Ref (a rowId) to its label from the reference table, falling
    // back to the raw id when the row is missing or the ref is not a rowId.
    const ressourceLabel = (ref: number | boolean): string => {
        const row =
            typeof ref === 'number' ? metaRessourceById.get(ref) : undefined
        return row?.Description_courte ?? String(ref)
    }
    // A fournisseur is an entreprise: the column kept its name when the table it
    // points at was renamed, so the label is read from `Entreprise`.
    const fournisseurLabel = (ref: number | boolean): string => {
        const row =
            typeof ref === 'number' ? entrepriseById.get(ref) : undefined
        return row?.Denomination ?? String(ref)
    }

    const ressourceColumns: readonly Column<Fetched_Ressource>[] = [
        {
            id: 'ressource',
            header: 'Ressource',
            render: (r) => ressourceLabel(r.Ressource),
        },
        {
            id: 'total',
            header: 'Total (en tonnes de matière verte / an)',
            render: (r) => r.Total_en_tMv_an_ ?? '—',
        },
    ]

    const fournisseurColumns: readonly Column<Fetched_Fournisseur>[] = [
        {
            id: 'fournisseur',
            header: 'Fournisseur',
            render: (r) => fournisseurLabel(r.Fournisseur),
        },
        {
            id: 'total',
            header: 'Total (en tonnes de matière verte / an)',
            render: (r) => r.Total_en_tMv_an_ ?? '—',
        },
        {
            id: 'repartition',
            header: 'Répartition',
            render: (r) => repartitionLabel(r.Repartition),
        },
    ]

    const planOptions = plans.map((plan) => ({
        value: plan.id,
        label: plan.Nom ?? `Plan ${plan.id}`,
    }))

    const ressourceRows = ressources.filter(
        (row) => row.Plan_d_approvisionnement === selectedPlanId
    )

    const ressourceTotal = ressourceRows.reduce(
        (sum, row) =>
            sum +
            (typeof row.Total_en_tMv_an_ === 'number'
                ? row.Total_en_tMv_an_
                : 0),
        0
    )

    const selectedRessourceRef =
        selectedRessource && typeof selectedRessource.Ressource === 'number'
            ? selectedRessource.Ressource
            : null

    // The region, fournisseur and département breakdowns all narrow to the same
    // selected (plan, ressource) pair.
    const matchesSelection = (row: {
        Plan_d_approvisionnement: number | boolean
        Ressource: number | boolean
    }) =>
        row.Plan_d_approvisionnement === selectedPlanId &&
        row.Ressource === selectedRessourceRef

    const regionRows = regions.filter(matchesSelection)
    const fournisseurRows = fournisseurs.filter(matchesSelection)
    const departementRows = departements.filter(matchesSelection)

    return (
        <div className="fr-p-2w">
            <SearchBar
                label="Rechercher un plan d’approvisionnement"
                placeholder="Rechercher un plan d’approvisionnement"
                options={planOptions}
                onSelect={(planId) => {
                    setSelectedPlanId(planId)
                    setSelectedRessource(null)
                }}
            />

            {selectedPlanId !== null && (
                <div className="fr-mt-4w">
                    <DataTable
                        caption="Ressources du plan sélectionné"
                        rows={ressourceRows}
                        columns={ressourceColumns}
                        bordered
                        selectedRows={
                            selectedRessource ? [selectedRessource] : []
                        }
                        onSelectionChange={(rows) =>
                            setSelectedRessource(
                                rows.find((row) => row !== selectedRessource) ??
                                    null
                            )
                        }
                        selectionLabel={(row) =>
                            `Sélectionner la ressource ${ressourceLabel(row.Ressource)}`
                        }
                    />
                    <p>
                        <strong>
                            Total : {ressourceTotal.toLocaleString('fr-FR')}{' '}
                            tonnes de matières vertes / an
                        </strong>
                    </p>
                </div>
            )}

            {selectedRessource && (
                <>
                    <div className="fr-mt-4w">
                        <DataTable
                            caption="Ventilation par région"
                            rows={regionRows}
                            columns={regionColumns}
                            bordered
                        />
                    </div>

                    <div className="fr-mt-4w">
                        <DataTable
                            caption="Ventilation par département"
                            rows={departementRows}
                            columns={departementColumns}
                            bordered
                        />
                    </div>

                    <div className="fr-mt-4w">
                        <DataTable
                            caption="Ventilation par fournisseur"
                            rows={fournisseurRows}
                            columns={fournisseurColumns}
                            bordered
                        />
                    </div>
                </>
            )}
        </div>
    )
}
