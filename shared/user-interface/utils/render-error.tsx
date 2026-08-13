import type { ReactNode } from 'react'
import Alert from '@shared/user-interface/component/Alert'
import {
    AccessDeniedError,
    DataSourceUnavailableError,
} from '@shared/application/errors'

export function renderError(error: Error, retry: () => void): ReactNode {
    if (error instanceof DataSourceUnavailableError) {
        return (
            <Alert severity="warning" title="Hors Grist">
                Avertissement : cette page n’est pas ouverte dans Grist, il n’y
                a donc aucun document à lire.
            </Alert>
        )
    }

    if (error instanceof AccessDeniedError) {
        return (
            <>
                <Alert severity="warning" title="Accès insuffisant">
                    Avertissement : ce widget a besoin d’un accès complet au
                    document. Ouvrez le panneau de configuration du widget et
                    choisissez « Accès complet au document ».
                </Alert>
                <button onClick={retry}>Réessayer</button>
            </>
        )
    }

    return (
        <>
            <Alert severity="error" title="Erreur">
                Erreur : impossible de charger les données : {error.message}
            </Alert>
            <button onClick={retry}>Réessayer</button>
        </>
    )
}
