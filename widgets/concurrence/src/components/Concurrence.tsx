import './Concurrence.css'
import DataTable, {
    type Column,
} from '@shared/user-interface/component/DataTable'
import MultiSelect, {
    type MultiSelectGroup,
} from '@shared/user-interface/component/MultiSelect'
import { getOptions } from '@shared/user-interface/utils/getOptions'
import type { DepartementsByRegion } from '@shared/core/application/read-models/departements-by-region'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { Departement } from '@shared/core/domain/value-objects/departement'

import { useCallback, useMemo, useState } from 'react'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { ConcurrenceRow } from '../load-concurrence'

type Props = {
    approvisionnementsByPlanAndRessource: readonly ConcurrenceRow[]
    departementsByRegion: readonly DepartementsByRegion[]
    fournisseurs: readonly Entreprise[]
}

export default function Concurrence({
    approvisionnementsByPlanAndRessource,
    departementsByRegion,
    fournisseurs: entreprises,
}: Props) {
    const [ressource, setRessource] = useState<string[]>([])
    const [departements, setDepartements] = useState<Departement['dep'][]>([])
    const [fournisseurs, setFournisseurs] = useState<Entreprise['siret'][]>([])

    const ressourceOptions = getOptions(
        approvisionnementsByPlanAndRessource,
        (item) => item.ressource
    )

    const fournisseurOptions = entreprises.map((entreprise) => ({
        value: entreprise.siret,
        label: entreprise.denomination || entreprise.siret,
    }))

    const denominationBySiret = useMemo(
        () => new Map(entreprises.map((e) => [e.siret, e.denomination])),
        [entreprises]
    )

    const departementOptions: readonly MultiSelectGroup<Departement['dep']>[] =
        departementsByRegion
            // Compared in French so accents sort where a reader looks for them:
            // "Île-de-France" belongs under I, not after Z. `toSorted` rather
            // than `sort`, which would reorder the caller's own array.
            .toSorted((a, b) =>
                a.region.libelle.localeCompare(b.region.libelle, 'fr')
            )
            .map(({ region, departements }) => ({
                id: region.reg,
                label: region.libelle,
                options: departements.map(({ dep }) => ({
                    value: dep,
                    label: dep,
                })),
            }))

    const isSelected = useCallback(
        (approvisionnement: Approvisionnement) =>
            (departements.length === 0 ||
                departements.includes(
                    approvisionnement.departementDeProvenance
                )) &&
            (fournisseurs.length === 0 ||
                fournisseurs.includes(approvisionnement.fournisseur)),
        [departements, fournisseurs]
    )

    const filteredRows = useMemo(
        () =>
            approvisionnementsByPlanAndRessource.filter(
                (item) =>
                    (ressource.length === 0 ||
                        ressource.includes(item.ressource)) &&
                    ((departements.length === 0 && fournisseurs.length === 0) ||
                        item.approvisionnements.some(isSelected))
            ),
        [
            approvisionnementsByPlanAndRessource,
            ressource,
            departements,
            fournisseurs,
            isSelected,
        ]
    )

    const getSelectedApprovisionnements = useCallback(
        (item: ConcurrenceRow) => {
            const selectedApprovisionnements =
                item.approvisionnements.filter(isSelected)

            return {
                departements: [
                    ...new Set(
                        selectedApprovisionnements.map(
                            (approvisionnement) =>
                                approvisionnement.departementDeProvenance
                        )
                    ),
                ].join(', '),
                fournisseurs: [
                    ...new Set(
                        selectedApprovisionnements.map(
                            (approvisionnement) =>
                                denominationBySiret.get(
                                    approvisionnement.fournisseur
                                ) || approvisionnement.fournisseur
                        )
                    ),
                ].join(', '),
                sumTonnageRetenu: selectedApprovisionnements.reduce(
                    (sum, approvisionnement) =>
                        sum + (approvisionnement.tonnageTotal ?? 0),
                    0
                ),
            }
        },
        [isSelected, denominationBySiret]
    )

    const columns: readonly Column<ConcurrenceRow>[] = useMemo(
        () => [
            {
                header: 'Plan d’approvisionnement',
                id: 'plan_d_approvisionnement',
                render: (item) => item.planDApprovisionnement,
                sortBy: (item) => item.planDApprovisionnement,
            },
            {
                header: 'Département de situation',
                id: 'departement_de_situation',
                render: (item) => item.departementDeSituation,
            },
            {
                header: 'Départements de provenance',
                id: 'departements_de_provenance',
                render: (item) =>
                    item.approvisionnements
                        .map(
                            (approvisionnement) =>
                                approvisionnement.departementDeProvenance
                        )
                        .join(', '),
            },
            {
                header: 'Tonnage total (en tonne de matière verte par an)',
                id: 'tonnage_total',
                render: (item) =>
                    !item.sumTonnageTotal ? 'N/A' : item.sumTonnageTotal,
            },
            {
                header: 'Départements retenus',
                id: 'departements_retenus',
                render: (item) =>
                    getSelectedApprovisionnements(item).departements,
            },
            {
                header: 'Tonnage retenu (en tonne de matière verte par an)',
                id: 'tonnage_retenu',
                render: (item) =>
                    getSelectedApprovisionnements(item).sumTonnageRetenu,
            },
        ],
        [getSelectedApprovisionnements]
    )

    return (
        <div className="concurrence">
            <h1 className="fr-h3 concurrence__title">
                Concurrence et conflits d&apos;usages potentiels entre projets
            </h1>
            <p className="fr-h4 concurrence__filters_title">
                Filtres d&apos;analyse de la concurrence
            </p>
            <div className="concurrence__filters">
                <div className="concurrence__filter">
                    <MultiSelect
                        label="Ressource"
                        options={ressourceOptions}
                        selectedValues={ressource}
                        onSelectionChange={setRessource}
                        showSelectAll
                    />
                </div>
                <div className="concurrence__filter">
                    <MultiSelect
                        label="Régions et départements"
                        options={departementOptions}
                        selectedValues={departements}
                        onSelectionChange={setDepartements}
                        showSelectAll
                    />
                </div>
                <div className="concurrence__filter">
                    <MultiSelect
                        label="Fournisseur"
                        options={fournisseurOptions}
                        selectedValues={fournisseurs}
                        onSelectionChange={setFournisseurs}
                        showSelectAll
                    />
                </div>
            </div>
            <div className="concurrence__table">
                <DataTable
                    caption={'Dossiers concernés'}
                    description="Cliquez sur un plan d’approvisionnement pour voir sa ressource et ses fournisseurs retenus sans quitter la page."
                    showResultCount
                    expandable={{
                        columnId: 'plan_d_approvisionnement',
                        render: (item) => (
                            <dl className="concurrence__detail">
                                <div>
                                    <dt>Ressource</dt>
                                    <dd>{item.ressource}</dd>
                                </div>
                                <div>
                                    <dt>Fournisseurs retenus</dt>
                                    <dd>
                                        {getSelectedApprovisionnements(item)
                                            .fournisseurs || 'Inconnu'}
                                    </dd>
                                </div>
                            </dl>
                        ),
                    }}
                    rows={filteredRows}
                    columns={columns}
                    stickyHeader
                    bordered
                    multiLine
                />
            </div>
        </div>
    )
}
