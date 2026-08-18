import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/component/link/link.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-user/icons-user.main.min.css'

import './Accueil.css'
import DataTable, {
    type Column,
} from '@shared/user-interface/component/DataTable'
import MultiSelect from '@shared/user-interface/component/MultiSelect'
import SearchBar from '@shared/user-interface/component/SearchBar'
import TagNature from './TagNature'
import TagStatut from './TagStatut'
import TagType from './TagType'
import TagUsage from './TagUsage'
import type { Departement } from '@shared/core/domain/value-objects/departement'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { ProgrammeAide } from '@shared/core/domain/entities/programme-aide'
import type { DepartementsByRegion } from '@shared/core/application/read-models/departements-by-region'
import type { PlanAccueil } from '@shared/core/plan-accueil'
import { useMemo, useState } from 'react'
import {
    getAppelAProjetOptions,
    getDepartementOptions,
    getDossierOptions,
    getFilteredRows,
    getFournisseurOptions,
    getStatutOptions,
} from '../utils'

function getColumns(
    onOpenDossier: (plan: PlanAccueil) => void
): readonly Column<PlanAccueil>[] {
    return [
        {
            id: 'action',
            header: 'Action',

            render: (plan) => (
                <button
                    type="button"
                    className="fr-btn fr-btn--secondary fr-btn--sm"
                    onClick={() => onOpenDossier(plan)}
                >
                    Voir le dossier
                </button>
            ),
        },
        {
            id: 'nom',
            header: 'Nom du dossier',
            render: (plan) => plan.nom,
            sortBy: (plan) => plan.nom,
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
        },
        {
            id: 'nature-donnee',
            header: 'Nature de la donnée',
            render: (plan) => <TagNature nature={plan.natureDonnee} />,
        },
        {
            id: 'statut',
            header: 'Statut',
            render: (plan) => <TagStatut statut={plan.statut} />,
        },
    ]
}

export type AccueilProps = {
    plansApprovisionnement: readonly PlanAccueil[]
    departementsByRegion: readonly DepartementsByRegion[]
    programmesAide: readonly ProgrammeAide[]
    onOpenDossier: (plan: PlanAccueil) => void
}

export default function Accueil({
    plansApprovisionnement,
    departementsByRegion,
    programmesAide,
    onOpenDossier,
}: AccueilProps) {
    const [nom, setNom] = useState('')
    const [statuts, setStatuts] = useState<string[]>([])
    const [departements, setDepartements] = useState<Departement['dep'][]>([])
    const [appelsAProjet, setAppelsAProjet] = useState<
        ProgrammeAide['appelAProjet'][]
    >([])
    const [fournisseurs, setFournisseurs] = useState<Entreprise['siret'][]>([])

    const [searchGeneration, setSearchGeneration] = useState(0)

    const columns = useMemo(() => getColumns(onOpenDossier), [onOpenDossier])

    const statutOptions = getStatutOptions(plansApprovisionnement)

    const dossierOptions = getDossierOptions(plansApprovisionnement)

    const departementOptions = getDepartementOptions(departementsByRegion)

    const appelAProjetOptions = getAppelAProjetOptions(programmesAide)

    const fournisseurOptions = getFournisseurOptions(plansApprovisionnement)

    const displayedRows = getFilteredRows(plansApprovisionnement, {
        nom,
        statuts,
        departements,
        appelsAProjet,
        fournisseurs,
    })

    const hasFilters =
        nom !== '' ||
        statuts.length > 0 ||
        departements.length > 0 ||
        appelsAProjet.length > 0 ||
        fournisseurs.length > 0

    function resetFilters() {
        setNom('')
        setStatuts([])
        setDepartements([])
        setAppelsAProjet([])
        setFournisseurs([])
        setSearchGeneration((generation) => generation + 1)
    }

    return (
        <div className="accueil fr-p-2w">
            <h1 className="fr-h3 accueil__title">
                Suivi des plans d’approvisionnement
            </h1>

            <div className="accueil__search">
                <SearchBar
                    key={searchGeneration}
                    label="Rechercher un dossier"
                    placeholder="Rechercher un dossier"
                    options={dossierOptions}
                    onSearch={setNom}
                    onSelect={setNom}
                />
            </div>

            <div className="accueil__filters fr-mt-2w">
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
                        label="Régions et départements"
                        options={departementOptions}
                        selectedValues={departements}
                        onSelectionChange={setDepartements}
                        showSelectAll
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

                <div className="accueil__filter">
                    <MultiSelect
                        label="Fournisseurs"
                        options={fournisseurOptions}
                        selectedValues={fournisseurs}
                        onSelectionChange={setFournisseurs}
                        showSelectAll
                    />
                </div>

                <button
                    type="button"
                    className="fr-btn fr-btn--tertiary"
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
                    showResultCount
                    bordered
                    stickyHeader
                />
            </div>
        </div>
    )
}
