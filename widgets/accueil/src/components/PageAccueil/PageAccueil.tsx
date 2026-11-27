import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/component/link/link.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-user/icons-user.main.min.css'

import './PageAccueil.css'
import DataTable, { type Column } from '@shared/react/components/DataTable'
import MultiSelect from '@shared/react/components/MultiSelect'
import SearchBar from '@shared/react/components/SearchBar'
import TagStatut from '../TagStatut'
import TagType from '../TagType'
import TagUsage from '../TagUsage'
import type { Crb } from '@shared/core/domain/entities/crb'
import type { Departement } from '@shared/core/domain/value-objects/departement'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { ProgrammeAide } from '@shared/core/domain/entities/programme-aide'
import type {
    DepartementsByRegion,
    ReferentielGeoPort,
} from '@shared/core/application/ports/referentiel-geo'
import {
    getAppelsAProjet,
    type PlanDetail,
} from '@shared/core/application/services/plan-detail'
import { useMemo, useState } from 'react'
import {
    getAppelAProjetOptions,
    getCommuneDeSituationLabel,
    getCrbOptions,
    getDepartementOptions,
    getFilteredRows,
    getFournisseurOptions,
    getPlanNames,
    getStatutOptions,
    getUsageOptions,
} from '../../utils'

function getColumns(
    onOpenPlan: (plan: PlanDetail) => void,
    getCommuneNom: ReferentielGeoPort['getCommuneNom']
): readonly Column<PlanDetail>[] {
    return [
        {
            id: 'action',
            header: 'Action',

            // Several plans share an installation, hence the plan's name in the
            // label. It opens with the visible text (WCAG 2.5.3); a hidden
            // span's space would collapse in a flex button.
            render: (plan) => (
                <button
                    type="button"
                    className="fr-btn fr-btn--secondary fr-btn--sm"
                    aria-label={
                        plan.nom === '' ? undefined : `Voir le plan ${plan.nom}`
                    }
                    onClick={() => onOpenPlan(plan)}
                >
                    Voir le plan
                </button>
            ),
        },
        {
            id: 'statut',
            header: 'Statut',
            render: (plan) => <TagStatut statut={plan.statut} />,
        },
        {
            id: 'nom-installation',
            header: 'Nom de l’installation',
            render: (plan) => plan.installationNom ?? '—',
            sortBy: (plan) => plan.installationNom ?? '',
        },
        {
            id: 'type',
            header: 'Type de plan',
            render: (plan) => <TagType type={plan.typeDePlan} />,
        },
        {
            id: 'usage',
            header: 'Usage principal',
            render: (plan) =>
                plan.usage === null ? '—' : <TagUsage usage={plan.usage} />,
            sortBy: (plan) => plan.usage ?? '',
        },
        {
            id: 'appel-a-projet',
            header: 'Appel à projet',
            render: (plan) => {
                const appels = getAppelsAProjet(plan)
                return appels.length === 0 ? '—' : appels.join(', ')
            },
        },
        {
            id: 'commune-de-situation',
            header: 'Commune de situation',
            render: (plan) =>
                getCommuneDeSituationLabel(plan, getCommuneNom) ?? '—',
            sortBy: (plan) =>
                getCommuneDeSituationLabel(plan, getCommuneNom) ?? '',
        },
    ]
}

export type PageAccueilProps = {
    plansApprovisionnement: readonly PlanDetail[]
    departementsByRegion: readonly DepartementsByRegion[]
    programmesAide: readonly ProgrammeAide[]
    getCommuneNom: ReferentielGeoPort['getCommuneNom']
    onOpenPlan: (plan: PlanDetail) => void
}

export default function PageAccueil({
    plansApprovisionnement,
    departementsByRegion,
    programmesAide,
    getCommuneNom,
    onOpenPlan,
}: PageAccueilProps) {
    const [nom, setNom] = useState('')
    const [statuts, setStatuts] = useState<string[]>([])
    const [usages, setUsages] = useState<string[]>([])
    const [departements, setDepartements] = useState<Departement['dep'][]>([])
    const [appelsAProjet, setAppelsAProjet] = useState<
        ProgrammeAide['appelAProjet'][]
    >([])
    const [fournisseurs, setFournisseurs] = useState<Entreprise['siret'][]>([])
    const [crbs, setCrbs] = useState<Crb['id'][]>([])

    const columns = useMemo(
        () => getColumns(onOpenPlan, getCommuneNom),
        [onOpenPlan, getCommuneNom]
    )

    const statutOptions = getStatutOptions(plansApprovisionnement)

    const usageOptions = getUsageOptions(plansApprovisionnement)

    const planNames = getPlanNames(plansApprovisionnement)

    const departementOptions = getDepartementOptions(departementsByRegion)

    const appelAProjetOptions = getAppelAProjetOptions(programmesAide)

    const fournisseurOptions = getFournisseurOptions(plansApprovisionnement)

    const crbOptions = getCrbOptions(plansApprovisionnement)

    const displayedRows = getFilteredRows(plansApprovisionnement, {
        nom,
        statuts,
        usages,
        departements,
        appelsAProjet,
        fournisseurs,
        crbs,
    })

    return (
        <div className="accueil fr-p-2w">
            <h1 className="fr-h3 accueil__title">
                Suivi des plans d’approvisionnement
            </h1>

            <div className="accueil__filters">
                <div className="accueil__filter">
                    <MultiSelect
                        label="Statut"
                        options={statutOptions}
                        selectedValues={statuts}
                        onSelectionChange={setStatuts}
                    />
                </div>

                <div className="accueil__filter">
                    <MultiSelect
                        label="Usage principal"
                        options={usageOptions}
                        selectedValues={usages}
                        onSelectionChange={setUsages}
                    />
                </div>

                <div className="accueil__filter">
                    <MultiSelect
                        label="Département de situation"
                        options={departementOptions}
                        selectedValues={departements}
                        onSelectionChange={setDepartements}
                    />
                </div>

                <div className="accueil__filter">
                    <MultiSelect
                        label="Appel à projet"
                        options={appelAProjetOptions}
                        selectedValues={appelsAProjet}
                        onSelectionChange={setAppelsAProjet}
                    />
                </div>

                <div className="accueil__filter">
                    <MultiSelect
                        label="Fournisseurs"
                        options={fournisseurOptions}
                        selectedValues={fournisseurs}
                        onSelectionChange={setFournisseurs}
                    />
                </div>

                <div className="accueil__filter">
                    <MultiSelect
                        label="CRB instructeur"
                        options={crbOptions}
                        selectedValues={crbs}
                        onSelectionChange={setCrbs}
                    />
                </div>
            </div>

            <div className="accueil__table">
                <DataTable
                    caption="Liste des plans d’approvisionnement"
                    rows={displayedRows}
                    columns={columns}
                    showResultCount
                    headerActions={
                        <SearchBar
                            label="Rechercher un plan"
                            placeholder="Rechercher un plan"
                            suggestions={planNames}
                            onSearch={setNom}
                        />
                    }
                    bordered
                    stickyHeader
                />
            </div>
        </div>
    )
}
