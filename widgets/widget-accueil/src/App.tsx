import { useGrist } from '@shared/hooks/useGrist'
import Accueil from './Accueil'

export default function App() {
    const gristState = useGrist()

    return (
        <main className="app">
            {gristState.status === 'connecting' && (
                <p>Connexion à Grist en cours…</p>
            )}

            {gristState.status === 'denied' && (
                <p>
                    Ce widget a besoin d’un accès complet au document. Ouvrez le
                    panneau de configuration du widget et choisissez « Accès
                    complet au document ».
                </p>
            )}

            {gristState.status === 'loading' && <p>Chargement des données…</p>}

            {gristState.status === 'error' && (
                <>
                    <p>
                        Impossible de charger les données :{' '}
                        {gristState.error.message}
                    </p>
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
