import type { ReactNode } from 'react'
import Alert from '@shared/react/components/Alert'
import type { UseAsyncState } from './UseAsyncState'
import { renderGristError } from './grist-render-error'

export type AsyncGateProps<T> = {
    state: UseAsyncState<T>
    children: (data: T) => ReactNode
}

export default function AsyncGate<T>({ state, children }: AsyncGateProps<T>) {
    switch (state.status) {
        case 'loading':
            return (
                <Alert severity="info" title="Chargement">
                    Information : chargement…
                </Alert>
            )

        case 'error':
            return <>{renderGristError(state.error, state.retry)}</>

        case 'ready':
            return <>{children(state.data)}</>
    }
}
