import AsyncGate from '@shared/react/components/AsyncGate'
import { useAsyncState } from '@shared/react/hooks/UseAsyncState'
import { DataSourceUnavailableError } from '@shared/core/errors'
import type { Ports } from './ports'
import { loadApprovisionnementsSaisieManuelle } from './load-approvisionnements-saisie-manuelle'
import Screen from './components/Screen'

export type AppProps = {
    ports: Ports
    /** Read instead of `ports` when Grist cannot be reached. */
    fallbackPorts: Ports
}

export default function App({ ports, fallbackPorts }: AppProps) {
    const state = useAsyncState(() =>
        loadApprovisionnementsSaisieManuelle(ports).catch((error: unknown) => {
            if (error instanceof DataSourceUnavailableError)
                return loadApprovisionnementsSaisieManuelle(fallbackPorts)

            throw error
        })
    )

    return (
        <main className="widget-approvisionnements-saisie-manuelle">
            <AsyncGate state={state}>
                {(data) => <Screen {...data} />}
            </AsyncGate>
        </main>
    )
}
