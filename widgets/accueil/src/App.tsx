import AsyncGate from '@shared/react/AsyncGate'
import { renderError } from '@shared/react/render-error'
import { useAsyncData } from '@shared/react/useAsyncData'
import Accueil from './components/Accueil'
import { loadAccueil, type AccueilPorts } from './load-accueil'

export default function App(ports: AccueilPorts) {
    const state = useAsyncData(() => loadAccueil(ports))

    return (
        <main className="app">
            <AsyncGate state={state} renderError={renderError}>
                {(screen) => <Accueil {...screen} />}
            </AsyncGate>
        </main>
    )
}
