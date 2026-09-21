import './Concurrence.css'
import PlanAccordionItem from './PlanAccordionItem'
import ProvenanceMap from '@shared/react/components/Ressource/ProvenanceMap'
import MultiSelect, {
    type MultiSelectGroup,
    type MultiSelectOption,
} from '@shared/react/components/MultiSelect'
import { getOptions } from '@shared/react/components/MultiSelect/getOptions'
import type {
    DepartementsByRegion,
    ReferentielGeoPort,
} from '@shared/core/application/ports/referentiel-geo'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import {
    getProvenanceLabel,
    PAYS_ETRANGER,
} from '@shared/core/domain/value-objects/provenance'

import { useCallback, useId, useMemo, useState } from 'react'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { ConcurrenceRow } from '../load-concurrence'
import type { PlanDApprovisionnement } from '@shared/core/domain/entities/plan-d-approvisionnement'
import { PLAN_STATUT_PROJECT } from '@shared/core/domain/value-objects/plan-statut'

type Props = {
    approvisionnementsByPlanAndRessource: readonly ConcurrenceRow[]
    departementsByRegion: readonly DepartementsByRegion[]
    fournisseurs: readonly Entreprise[]
    getCommuneCenterPosition: ReferentielGeoPort['getCommuneCenterPosition']
    getDepartementContour: ReferentielGeoPort['getDepartementContour']
    getCountryContour: ReferentielGeoPort['getCountryContour']
}

const byLabel = (a: string, b: string) => a.localeCompare(b, 'fr')

/** Each provenance once, however many approvisionnements draw on it. */
const provenancesOf = (approvisionnements: readonly Approvisionnement[]) => [
    ...new Set(
        approvisionnements.map((approvisionnement) =>
            getProvenanceLabel(approvisionnement.provenance)
        )
    ),
]

export default function Concurrence({
    approvisionnementsByPlanAndRessource,
    departementsByRegion,
    fournisseurs: entreprises,
    getCommuneCenterPosition,
    getDepartementContour,
    getCountryContour,
}: Props) {
    const [ressource, setRessource] = useState<string[]>([])
    const [provenances, setProvenances] = useState<string[]>([])
    const [fournisseurs, setFournisseurs] = useState<Entreprise['siret'][]>([])
    const [planStatut, setPlanStatut] = useState<
        PlanDApprovisionnement['statut'][]
    >([PLAN_STATUT_PROJECT])

    // Keyed by the row object, not its index: filtering moves a row's position,
    // and an index would leave whichever row landed there open.
    const [expandedRows, setExpandedRows] = useState<
        ReadonlySet<ConcurrenceRow>
    >(new Set())

    function toggleExpanded(row: ConcurrenceRow) {
        setExpandedRows((current) => {
            const next = new Set(current)
            if (!next.delete(row)) next.add(row)
            return next
        })
    }

    const listTitleId = useId()

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
    const planStatutOptions: MultiSelectOption<string>[] = getOptions(
        approvisionnementsByPlanAndRessource,
        (item) => item.plan.statut
    )

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
                        item.approvisionnements.some(isSelected)) &&
                    (planStatut.length === 0 ||
                        planStatut.includes(item.plan.statut))
            ),
        [
            approvisionnementsByPlanAndRessource,
            ressource,
            provenances.length,
            fournisseurs.length,
            isSelected,
            planStatut,
        ]
    )

    const communes = useMemo(
        () =>
            filteredRows
                .map(({ plan }) => plan.installationCommune)
                .filter((commune) => commune !== null),
        [filteredRows]
    )

    const approvisionnementsRetenus = useMemo(
        () =>
            filteredRows.flatMap((item) =>
                item.approvisionnements.filter(isSelected)
            ),
        [filteredRows, isSelected]
    )

    const getSelectedApprovisionnements = useCallback(
        (item: ConcurrenceRow) => {
            const selectedApprovisionnements =
                item.approvisionnements.filter(isSelected)

            return {
                provenances: provenancesOf(selectedApprovisionnements),
                fournisseurs: [
                    ...new Set(
                        selectedApprovisionnements.map(
                            (approvisionnement) =>
                                denominationBySiret.get(
                                    approvisionnement.fournisseur
                                ) || approvisionnement.fournisseur
                        )
                    ),
                ],
                sumTonnageRetenu: selectedApprovisionnements.reduce(
                    (sum, approvisionnement) =>
                        sum + (approvisionnement.tonnageTotal ?? 0),
                    0
                ),
            }
        },
        [isSelected, denominationBySiret]
    )

    return (
        <div className="concurrence">
            <h1 className="fr-h6 concurrence__title">
                Concurrence et conflits d&apos;usages potentiels entre projets
            </h1>
            <div className="concurrence__filters">
                <div className="concurrence__filter">
                    <MultiSelect
                        label="Statut"
                        options={planStatutOptions}
                        selectedValues={planStatut}
                        onSelectionChange={setPlanStatut}
                        showSelectAll
                    />
                </div>
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
            <div className="concurrence__results">
                <section
                    className="concurrence__list"
                    aria-labelledby={listTitleId}
                >
                    <div className="concurrence__list-header">
                        <h2
                            id={listTitleId}
                            className="concurrence__list-title"
                        >
                            Plans concernés
                        </h2>
                        {/* Announced on change: a sighted reader watches the
                            count move as filters are applied. */}
                        <p
                            className="concurrence__result-count"
                            aria-live="polite"
                        >
                            {filteredRows.length} résultat
                            {filteredRows.length > 1 ? 's' : ''}
                        </p>
                    </div>
                    <ul className="fr-accordions-group concurrence__plans">
                        {filteredRows.map((item, index) => {
                            const retenus = getSelectedApprovisionnements(item)

                            return (
                                <PlanAccordionItem
                                    key={index}
                                    nom={item.plan.nom}
                                    departementDeSituation={
                                        item.plan.departementDeSituation
                                    }
                                    ressource={item.ressource}
                                    tonnageTotal={item.tonnageTotal}
                                    provenances={provenancesOf(
                                        item.approvisionnements
                                    )}
                                    tonnageRetenu={retenus.sumTonnageRetenu}
                                    provenancesRetenues={retenus.provenances}
                                    fournisseursRetenus={retenus.fournisseurs}
                                    isExpanded={expandedRows.has(item)}
                                    onToggle={() => toggleExpanded(item)}
                                />
                            )
                        })}
                    </ul>
                </section>

                <div className="concurrence__map">
                    <ProvenanceMap
                        approvisionnements={approvisionnementsRetenus}
                        communes={communes}
                        getCommuneCenterPosition={getCommuneCenterPosition}
                        getDepartementContour={getDepartementContour}
                        getCountryContour={getCountryContour}
                    />
                </div>
            </div>
        </div>
    )
}
