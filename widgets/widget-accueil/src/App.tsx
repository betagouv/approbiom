import { useGrist } from '@shared/hooks/useGrist'
import Alert from '@shared/components/Alert'
import Accueil from './Accueil'

export default function App() {
    const gristState = useGrist()

    return (
        <main className="app">
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
