import AsyncGate from '@shared/react/ui/components/AsyncGate'
import { useAsyncState } from '@shared/react/hooks/UseAsyncState'
import { DataSourceUnavailableError } from '@shared/core/errors'
import type { Ports } from './ports'
import { loadApprovisionnementsImportDocument } from './load-approvisionnements-import-document'
import Screen from './components/Screen'

export type AppProps = {
    ports: Ports
    /** Read instead of `ports` when Grist cannot be reached. */
    fallbackPorts: Ports
}

export default function App({ ports, fallbackPorts }: AppProps) {
    const state = useAsyncState(() =>
        loadApprovisionnementsImportDocument(ports).catch((error: unknown) => {
            if (error instanceof DataSourceUnavailableError)
                return loadApprovisionnementsImportDocument(fallbackPorts)

            throw error
        })
    )

    return (
        <main className="widget-approvisionnements-import-document">
            <AsyncGate state={state}>
                {(data) => <Screen {...data} />}
            </AsyncGate>
        </main>
    )
}
