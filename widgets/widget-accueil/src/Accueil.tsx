import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/component/link/link.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-user/icons-user.main.min.css'

import './Accueil.css'
import DataTable, { type Column } from '@shared/components/DataTable'
import MultiSelect from '@shared/components/MultiSelect'
import SearchBar from '@shared/components/SearchBar'
import TagNature from './components/TagNature'
import TagStatut from './components/TagStatut'
import TagType from './components/TagType'
import TagUsage from './components/TagUsage'
import type { Plan_d_approvisionnement } from '@shared/grist/approbiom/tables'
import { useState } from 'react'
import {
    getAppelAProjetOptions,
    getFilteredRows,
    getLieuOptions,
    getStatutOptions,
} from './utils'
import Drawer from './components/Drawer'

function buildColumns(
    onOpen: (plan: Plan_d_approvisionnement) => void
): readonly Column<Plan_d_approvisionnement>[] {
    return [
        {
            id: 'nom',
            header: 'Nom du dossier',
            render: (plan) => plan.Nom,
        },
        {
            id: 'departement-de-situation',
            header: 'Département de situation',
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
            render: (plan) => <TagUsage usage={plan.Usage_principal} />,
        },
        {
            id: 'mise-en-service',
            header: 'Mise en service projet',

            render: (plan) => plan.Mise_en_service_projet || '-',
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
        {
            id: 'action',
            header: 'Action',

            render: (plan) => (
                <button
                    type="button"
                    className="fr-btn fr-btn--secondary"
                    onClick={() => onOpen(plan)}
                >
                    Voir le dossier
                </button>
            ),
        },
    ]
}

export type AccueilProps = {
    plansApprovisionnement: readonly Plan_d_approvisionnement[]
}

export default function Accueil({ plansApprovisionnement }: AccueilProps) {
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
        useState<Plan_d_approvisionnement | null>(null)

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

                <SearchBar
                    key={searchGeneration}
                    label="Rechercher un dossier par nom"
                    placeholder="Rechercher un dossier par nom"
                    onSearch={setNom}
                />

                <div className="accueil__filters">
                    <p className="accueil__filters-label">Filtrer :</p>
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
                <Drawer plan={openedPlan} onClose={() => setOpenedPlan(null)} />
            )}
        </>
    )
}
