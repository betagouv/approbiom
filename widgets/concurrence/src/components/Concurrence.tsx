import './Concurrence.css'
import DataTable, { type Column } from '@shared/react/components/DataTable'
import MultiSelect, {
    type MultiSelectGroup,
} from '@shared/react/components/MultiSelect'
import { getOptions } from '@shared/react/getOptions'
import type { DepartementsByRegion } from '@shared/core/application/ports/insee'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import {
    getProvenanceLabel,
    PAYS_ETRANGER,
} from '@shared/core/domain/value-objects/provenance'

import { useCallback, useMemo, useState } from 'react'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { ConcurrenceRow } from '../load-concurrence'

type Props = {
    approvisionnementsByPlanAndRessource: readonly ConcurrenceRow[]
    departementsByRegion: readonly DepartementsByRegion[]
    fournisseurs: readonly Entreprise[]
}

const byLabel = (a: string, b: string) => a.localeCompare(b, 'fr')

export default function Concurrence({
    approvisionnementsByPlanAndRessource,
    departementsByRegion,
    fournisseurs: entreprises,
}: Props) {
    const [ressource, setRessource] = useState<string[]>([])
    const [provenances, setProvenances] = useState<string[]>([])
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

    const paysOptions = useMemo(
        () =>
            [
                ...new Set(
                    approvisionnementsByPlanAndRessource.flatMap((item) =>
                        item.approvisionnements
                            .map(({ provenance }) => provenance)
                            .filter(
                                (provenance) =>
                                    provenance.source === PAYS_ETRANGER
                            )
                            .map(getProvenanceLabel)
                    )
                ),
            ]
                .filter((libelle) => libelle !== '')
                .toSorted(byLabel)
                .map((libelle) => ({ value: libelle, label: libelle })),
        [approvisionnementsByPlanAndRessource]
    )

    const provenanceOptions: readonly MultiSelectGroup<string>[] =
        useMemo(() => {
            const regions = departementsByRegion
                .toSorted((a, b) => byLabel(a.region.libelle, b.region.libelle))
                .map(({ region, departements }) => ({
                    id: region.reg,
                    label: region.libelle,
                    options: departements.map(({ dep }) => ({
                        value: dep,
                        label: dep,
                    })),
                }))

            if (paysOptions.length === 0) return regions

            return [
                ...regions,
                {
                    id: 'pays-etrangers',
                    label: 'Pays étrangers',
                    options: paysOptions,
                },
            ]
        }, [departementsByRegion, paysOptions])

    const isSelected = useCallback(
        (approvisionnement: Approvisionnement) =>
            (provenances.length === 0 ||
                provenances.includes(
                    getProvenanceLabel(approvisionnement.provenance)
                )) &&
            (fournisseurs.length === 0 ||
                fournisseurs.includes(approvisionnement.fournisseur)),
        [provenances, fournisseurs]
    )

    const filteredRows = useMemo(
        () =>
            approvisionnementsByPlanAndRessource.filter(
                (item) =>
                    (ressource.length === 0 ||
                        ressource.includes(item.ressource)) &&
                    ((provenances.length === 0 && fournisseurs.length === 0) ||
                        item.approvisionnements.some(isSelected))
            ),
        [
            approvisionnementsByPlanAndRessource,
            ressource,
            provenances,
            fournisseurs,
            isSelected,
        ]
    )

    const getSelectedApprovisionnements = useCallback(
        (item: ConcurrenceRow) => {
            const selectedApprovisionnements =
                item.approvisionnements.filter(isSelected)

            return {
                provenances: [
                    ...new Set(
                        selectedApprovisionnements.map((approvisionnement) =>
                            getProvenanceLabel(approvisionnement.provenance)
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
                header: 'Provenances',
                id: 'provenances',
                render: (item) =>
                    [
                        ...new Set(
                            item.approvisionnements.map((approvisionnement) =>
                                getProvenanceLabel(approvisionnement.provenance)
                            )
                        ),
                    ].join(', '),
            },
            {
                header: 'Tonnage total (en tonne de matière verte par an)',
                id: 'tonnage_total',
                render: (item) => item.tonnageTotal,
            },
            {
                header: 'Provenances retenues',
                id: 'provenances_retenues',
                render: (item) =>
                    getSelectedApprovisionnements(item).provenances,
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
                        label="Provenance"
                        options={provenanceOptions}
                        selectedValues={provenances}
                        onSelectionChange={setProvenances}
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
                    caption={'Plans concernés'}
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
                    bordered
                    multiLine
                />
            </div>
        </div>
    )
}
