import { useGrist } from '@shared/hooks/useGrist'
import Alert from '@shared/components/Alert'
import Accueil from './Accueil'
import DataTable from '@shared/components/DataTable'

type FakePlan = {
    id: number
    name: string
    status: string
    year: number
}

const rows: FakePlan[] = [
    {
        id: 1,
        name: 'Chaufferie',
        status: 'Projet',
        year: 2028,
    },
    {
        id: 2,
        name: 'RC St Junien',
        status: 'En fonctionnement',
        year: 2026,
    },
    {
        id: 3,
        name: 'BIO2 St Gaudens',
        status: 'Obsolète',
        year: 2007,
    },
]

export default function App() {
    const gristState = useGrist()

    return (
        <main className="app">
            <DataTable
                caption="Les plans d'approvisionnement"
                rows={rows}
                columns={[
                    {
                        id: 'name',
                        header: 'Nom du dossier',
                        render: (row) => row.name,
                    },
                    {
                        id: 'status',
                        header: 'Statut',
                        render: (row) => row.status,
                    },
                    {
                        id: 'year',
                        header: 'Mise en service',
                        render: (row) => row.year,
                    },
                ]}
            />
            {gristState.status === 'connecting' && (
                <Alert severity="info" title="Connexion en cours">
                    Information : connexion à Grist en cours…
                </Alert>
            )}

            {gristState.status === 'denied' && (
                <Alert severity="warning" title="Accès insuffisant">
                    Avertissement : ce widget a besoin d’un accès complet au
                    document. Ouvrez le panneau de configuration du widget et
                    choisissez « Accès complet au document ».
                </Alert>
            )}

            {gristState.status === 'loading' && (
                <Alert severity="info" title="Chargement">
                    Information : chargement des données…
                </Alert>
            )}

            {gristState.status === 'error' && (
                <>
                    <Alert severity="error" title="Erreur">
                        Erreur : impossible de charger les données :{' '}
                        {gristState.error.message}
                    </Alert>
                    <button onClick={gristState.refetch}>Réessayer</button>
                </>
            )}

            {gristState.status === 'ready' && (
                <Accueil
                    plansApprovisionnement={
                        gristState.data.Plan_d_approvisionnement
                    }
                />
            )}
        </main>
    )
}
