import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/component/link/link.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-user/icons-user.main.min.css'

import './Accueil.css'
import DataTable, { type Column } from '@shared/components/DataTable'
import MultiSelect from '@shared/components/MultiSelect'
import SearchBar from '@shared/components/SearchBar'
import TagNature from './TagNature'
import TagStatut from './TagStatut'
import TagType from './TagType'
import TagUsage from './TagUsage'
import type { PlanDapprovisionnementAccueil } from '../grist'
import { useState } from 'react'
import {
    getAppelAProjetOptions,
    getFilteredRows,
    getLieuOptions,
    getResultCountLabel,
    getStatutOptions,
    type DemandeSubvention,
} from '../utils'
import Drawer from './Drawer'

function buildColumns(
    onOpen: (plan: PlanDapprovisionnementAccueil) => void
): readonly Column<PlanDapprovisionnementAccueil>[] {
    return [
        {
            id: 'action',
            header: 'Action',

            render: (plan) => (
                <button
                    type="button"
                    className="fr-btn fr-btn--secondary fr-btn--sm"
                    onClick={() => onOpen(plan)}
                >
                    Voir le dossier
                </button>
            ),
        },
        {
            id: 'nom',
            header: 'Nom du dossier',
            render: (plan) => plan.Nom,
        },
        {
            id: 'departement-de-situation',
            header: 'Lieu installation',
            render: (plan) => plan.Departement_de_situation,
        },
        {
            id: 'appel-a-projet',
            header: 'Appel à projet',
            render: (plan) => plan.Appel_a_projet,
        },
        {
            id: 'type',
            header: 'Type de plan',
            render: (plan) => <TagType type={plan.Type_de_plan} />,
        },
        {
            id: 'usage',
            header: 'Usage',
            render: (plan) => <TagUsage usage={plan.Usage_principal ?? ''} />,
        },
        {
            id: 'nature-donnee',
            header: 'Nature de la donnée',
            render: (plan) => <TagNature nature={plan.Nature_Donnee} />,
        },
        {
            id: 'statut',
            header: 'Statut',
            render: (plan) => <TagStatut statut={plan.Statut} />,
        },
    ]
}

export type AccueilProps = {
    plansApprovisionnement: readonly PlanDapprovisionnementAccueil[]
    demandesSubventionByPlanId: ReadonlyMap<
        number,
        readonly DemandeSubvention[]
    >
}

export default function Accueil({
    plansApprovisionnement,
    demandesSubventionByPlanId,
}: AccueilProps) {
    const [nom, setNom] = useState('')
    const [statuts, setStatuts] = useState<string[]>([])
    const [lieux, setLieux] = useState<string[]>([])
    const [appelsAProjet, setAppelsAProjet] = useState<string[]>([])

    // Bumped on reset, and used as the key of the search bar: the field holds
    // the text the user typed itself, so emptying `nom` here would leave the
    // word on screen filtering nothing. Remounting is what clears it, short of
    // giving SearchBar a controlled value.
    const [searchGeneration, setSearchGeneration] = useState(0)

    const [openedPlan, setOpenedPlan] =
        useState<PlanDapprovisionnementAccueil | null>(null)

    const columns = buildColumns(setOpenedPlan)

    const statutOptions = getStatutOptions(plansApprovisionnement)
    const lieuOptions = getLieuOptions(plansApprovisionnement)
    const appelAProjetOptions = getAppelAProjetOptions(plansApprovisionnement)

    const displayedRows = getFilteredRows(plansApprovisionnement, {
        nom,
        statuts,
        lieux,
        appelsAProjet,
    })

    const hasFilters =
        nom !== '' ||
        statuts.length > 0 ||
        lieux.length > 0 ||
        appelsAProjet.length > 0

    function resetFilters() {
        setNom('')
        setStatuts([])
        setLieux([])
        setAppelsAProjet([])
        setSearchGeneration((generation) => generation + 1)
    }

    return (
        <>
            <div className="accueil">
                <header className="accueil__header">
                    <h1 className="fr-h3 accueil__title">
                        Suivi des plans d’approvisionnement
                    </h1>
                </header>

                <div className="accueil__search">
                    <SearchBar
                        key={searchGeneration}
                        label="Rechercher un dossier par nom"
                        placeholder="Rechercher un dossier par nom"
                        onSearch={setNom}
                    />
                    <p className="accueil__results" aria-live="polite">
                        {getResultCountLabel(displayedRows.length)}
                    </p>
                </div>

                <div className="accueil__filters">
                    <div className="accueil__filter">
                        <MultiSelect
                            label="Statut"
                            options={statutOptions}
                            selectedValues={statuts}
                            onSelectionChange={setStatuts}
                            showSelectAll
                        />
                    </div>
                    <div className="accueil__filter">
                        <MultiSelect
                            label="Lieu"
                            options={lieuOptions}
                            selectedValues={lieux}
                            onSelectionChange={setLieux}
                            showSelectAll
                            legend="Communes, par département"
                            hideLegend
                        />
                    </div>
                    <div className="accueil__filter">
                        <MultiSelect
                            label="Appel à projet"
                            options={appelAProjetOptions}
                            selectedValues={appelsAProjet}
                            onSelectionChange={setAppelsAProjet}
                            showSelectAll
                        />
                    </div>
                    <button
                        type="button"
                        className="fr-btn fr-btn--tertiary accueil__reset"
                        onClick={resetFilters}
                        disabled={!hasFilters}
                    >
                        Réinitialiser les filtres
                    </button>
                </div>

                <div className="accueil__table">
                    <DataTable
                        caption="Liste des plans d’approvisionnement"
                        rows={displayedRows}
                        columns={columns}
                        bordered
                        stickyHeader
                    />
                </div>
            </div>

            {openedPlan && (
                <Drawer
                    plan={openedPlan}
                    demandesSubvention={
                        demandesSubventionByPlanId.get(openedPlan.id) ?? []
                    }
                    onClose={() => setOpenedPlan(null)}
                />
            )}
        </>
    )
}
