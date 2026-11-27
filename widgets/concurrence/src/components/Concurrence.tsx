import './Concurrence.css'
import ProvenanceMap from '@shared/react/ui/components/Ressource/ProvenanceMap'
import markerIconUrl from 'leaflet/dist/images/marker-icon.png'
import MultiSelect, {
    type MultiSelectGroup,
    type MultiSelectOption,
} from '@shared/react/ui/components/MultiSelect'
import { getOptions } from '@shared/react/ui/components/MultiSelect/getOptions'
import type {
    DepartementsByRegion,
    ReferentielGeoPort,
} from '@shared/core/application/ports/referentiel-geo'
import {
    getProvenanceLabel,
    PAYS_ETRANGER,
} from '@shared/core/domain/value-objects/provenance'

import { useCallback, useMemo, useState } from 'react'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { ConcurrenceRow } from '../load-concurrence'
import {
    buildPlansConcurrents,
    type GetIsApprovisionnementRetenu,
} from '../build-plans-concurrents'
import ConcurrenceTable from './ConcurrenceTable'
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

    const ressourceOptions = getOptions(
        approvisionnementsByPlanAndRessource,
        (item) => item.ressource
    )
    const fournisseurOptions = entreprises
        .map((entreprise) => ({
            value: entreprise.siret,
            label: entreprise.denomination || entreprise.siret,
        }))
        .toSorted((a, b) => byLabel(a.label, b.label))

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

    const getIsApprovisionnementRetenu: GetIsApprovisionnementRetenu =
        useCallback(
            (approvisionnement) =>
                (provenances.length === 0 ||
                    provenances.includes(
                        getProvenanceLabel(approvisionnement.provenance)
                    )) &&
                (fournisseurs.length === 0 ||
                    (approvisionnement.fournisseur !== undefined &&
                        fournisseurs.includes(approvisionnement.fournisseur))),
            [provenances, fournisseurs]
        )

    const filteredRows = useMemo(
        () =>
            approvisionnementsByPlanAndRessource.filter(
                (item) =>
                    (ressource.length === 0 ||
                        ressource.includes(item.ressource)) &&
                    (planStatut.length === 0 ||
                        planStatut.includes(item.plan.statut))
            ),
        [approvisionnementsByPlanAndRessource, ressource, planStatut]
    )

    const plansConcurrents = useMemo(
        () =>
            buildPlansConcurrents(
                filteredRows,
                getIsApprovisionnementRetenu,
                denominationBySiret
            ),
        [filteredRows, getIsApprovisionnementRetenu, denominationBySiret]
    )

    const communes = useMemo(
        () =>
            plansConcurrents
                .map(({ plan }) => plan.installationCommune)
                .filter((commune) => commune !== null),
        [plansConcurrents]
    )

    const approvisionnementsRetenus = useMemo(
        () =>
            filteredRows.flatMap((item) =>
                item.approvisionnements.filter(getIsApprovisionnementRetenu)
            ),
        [filteredRows, getIsApprovisionnementRetenu]
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
                    />
                </div>
                <div className="concurrence__filter">
                    <MultiSelect
                        label="Ressource"
                        options={ressourceOptions}
                        selectedValues={ressource}
                        onSelectionChange={setRessource}
                    />
                </div>
                <div className="concurrence__filter">
                    <MultiSelect
                        label="Provenance"
                        options={provenanceOptions}
                        selectedValues={provenances}
                        onSelectionChange={setProvenances}
                        searchable
                    />
                </div>
                <div className="concurrence__filter">
                    <MultiSelect
                        label="Fournisseur"
                        options={fournisseurOptions}
                        selectedValues={fournisseurs}
                        onSelectionChange={setFournisseurs}
                        searchable
                    />
                </div>
            </div>
            <div className="concurrence__results">
                <div className="concurrence__table">
                    <ConcurrenceTable plansConcurrents={plansConcurrents} />
                </div>

                <div className="concurrence__map">
                    <ProvenanceMap
                        approvisionnements={approvisionnementsRetenus}
                        communes={communes}
                        getCommuneCenterPosition={getCommuneCenterPosition}
                        getDepartementContour={getDepartementContour}
                        getCountryContour={getCountryContour}
                    />
                    {communes.length > 0 && (
                        <p className="concurrence__map-legend">
                            <img
                                className="concurrence__map-legend-pin"
                                src={markerIconUrl}
                                alt=""
                            />
                            Installations des plans affichés, au centre de leur
                            commune
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
