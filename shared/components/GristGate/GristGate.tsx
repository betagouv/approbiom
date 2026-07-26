import type { ReactNode } from 'react'
import Alert from '@shared/components/Alert'
import type { UseGristResult } from '@shared/hooks/useGrist'

export type GristGateProps<D> = {
    state: UseGristResult<D>
    fakeData?: D
    children: (data: D) => ReactNode
}

export default function GristGate<D>({
    state,
    fakeData,
    children,
}: GristGateProps<D>) {
    switch (state.status) {
        case 'connecting':
            return (
                <Alert severity="info" title="Connexion en cours">
                    Information : connexion à Grist en cours…
                </Alert>
            )

        case 'grist undefined':
            return fakeData === undefined ? (
                <Alert severity="warning" title="Hors Grist">
                    Avertissement : cette page n’est pas ouverte dans Grist, il
                    n’y a donc aucun document à lire.
                </Alert>
            ) : (
                <>
                    <Alert severity="warning" title="Données fictives">
                        Avertissement : cette page n’est pas ouverte dans Grist.
                        Les données affichées ci-dessous sont fictives et ne
                        servent qu’à illustrer l’interface.
                    </Alert>
                    {children(fakeData)}
                </>
            )

        case 'denied':
            return (
                <Alert severity="warning" title="Accès insuffisant">
                    Avertissement : ce widget a besoin d’un accès complet au
                    document. Ouvrez le panneau de configuration du widget et
                    choisissez « Accès complet au document ».
                </Alert>
            )

        case 'loading':
            return (
                <Alert severity="info" title="Chargement">
                    Information : chargement des données…
                </Alert>
            )

        case 'error':
            return (
                <>
                    <Alert severity="error" title="Erreur">
                        Erreur : impossible de charger les données :{' '}
                        {state.error.message}
                    </Alert>
                    <button onClick={state.refetch}>Réessayer</button>
                </>
            )

        case 'ready':
            return <>{children(state.data)}</>
    }
}
