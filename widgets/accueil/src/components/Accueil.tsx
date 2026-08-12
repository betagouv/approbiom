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
import type { Plan } from '@shared/application/read-models/plan'
import { useMemo, useState } from 'react'
import { getFilteredRows, getStatutOptions } from '../utils'

function getColumns(
    onOpenDossier: (plan: Plan) => void
): readonly Column<Plan>[] {
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
    plansApprovisionnement: readonly Plan[]
    onOpenDossier: (plan: Plan) => void
}

export default function Accueil({
    plansApprovisionnement,
    onOpenDossier,
}: AccueilProps) {
    const [nom, setNom] = useState('')
    const [statuts, setStatuts] = useState<string[]>([])

    const [searchGeneration, setSearchGeneration] = useState(0)

    const columns = useMemo(() => getColumns(onOpenDossier), [onOpenDossier])

    const statutOptions = getStatutOptions(plansApprovisionnement)

    const displayedRows = getFilteredRows(plansApprovisionnement, {
        nom,
        statuts,
    })

    const hasFilters = nom !== '' || statuts.length > 0

    function resetFilters() {
        setNom('')
        setStatuts([])
        setSearchGeneration((generation) => generation + 1)
    }

    return (
        <div className="accueil fr-p-2w">
            <h1 className="fr-h3">Suivi des plans d’approvisionnement</h1>

            <div className="accueil__search fr-mt-3w">
                <SearchBar
                    key={searchGeneration}
                    label="Rechercher un dossier"
                    placeholder="Rechercher un dossier"
                    onSearch={setNom}
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

                <button
                    type="button"
                    className="fr-btn fr-btn--tertiary"
                    onClick={resetFilters}
                    disabled={!hasFilters}
                >
                    Réinitialiser les filtres
                </button>
            </div>

            <div className="fr-mt-3w">
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
