import type { ReactNode } from 'react'
import Alert from '@shared/user-interface/component/Alert'
import type { UseAsyncDataResult } from './useAsyncData'

export type AsyncGateProps<T> = {
    state: UseAsyncDataResult<T>
    // Lets the composition root explain failures in the terms of whichever
    // adapter it wired in — a missing Grist handshake reads nothing like a
    // dropped HTTP request. Left out, the message alone is shown.
    renderError?: (error: Error, retry: () => void) => ReactNode
    children: (data: T) => ReactNode
}

export default function AsyncGate<T>({
    state,
    renderError,
    children,
}: AsyncGateProps<T>) {
    switch (state.status) {
        case 'loading':
            return (
                <Alert severity="info" title="Chargement">
                    Information : chargement des données…
                </Alert>
            )

        case 'error':
            if (renderError) return <>{renderError(state.error, state.retry)}</>

            return (
                <>
                    <Alert severity="error" title="Erreur">
                        Erreur : impossible de charger les données :{' '}
                        {state.error.message}
                    </Alert>
                    <button onClick={state.retry}>Réessayer</button>
                </>
            )

        case 'ready':
            return <>{children(state.data)}</>
    }
}
