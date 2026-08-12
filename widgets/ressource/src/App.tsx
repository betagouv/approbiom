import AsyncGate from '@shared/react/AsyncGate'
import { renderError } from '@shared/react/render-error'
import { useAsyncData } from '@shared/react/useAsyncData'
import Ressource from './components/Ressource'
import { loadRessource, type RessourcePorts } from './load-ressource'

export default function App(ports: RessourcePorts) {
    const state = useAsyncData(() => loadRessource(ports))

    return (
        <main className="app">
            <AsyncGate state={state} renderError={renderError}>
                {(screen) => <Ressource {...screen} />}
            </AsyncGate>
        </main>
    )
}
