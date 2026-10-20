import Alert from '@shared/react/components/Alert'
import DataTable, { type Column } from '@shared/react/components/DataTable'
import { lundiNumerique } from '../format-semaine'
import type { CreationsDeLaSemaine, SuiviCreations } from '../suivi-creations'
import CadreSemaine from './CadreSemaine'

const COLONNES: Column<CreationsDeLaSemaine>[] = [
    {
        id: 'semaine',
        header: 'Semaine du',
        render: ({ semaine }) => lundiNumerique(semaine),
        sortBy: ({ semaine }) => semaine,
    },
    {
        id: 'utilisateur',
        header: 'Utilisateur',
        render: ({ utilisateur }) => utilisateur,
        sortBy: ({ utilisateur }) => utilisateur,
    },
    {
        id: 'plans',
        header: 'Plans créés',
        render: ({ plans }) => plans,
        sortBy: ({ plans }) => plans,
    },
]

type TableauDeBordProps = {
    suivi: SuiviCreations
}

export default function TableauDeBord({ suivi }: TableauDeBordProps) {
    return (
        <>
            <CadreSemaine suivi={suivi} />
            {suivi.lignes.length === 0 ? (
                <Alert severity="info" title="Aucun plan créé">
                    Information : aucun utilisateur n’a créé de plan depuis le
                    début du suivi.
                </Alert>
            ) : (
                <DataTable
                    caption="Plans créés par utilisateur et par semaine"
                    rows={suivi.lignes}
                    columns={COLONNES}
                    bordered
                />
            )}
        </>
    )
}
