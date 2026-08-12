import AsyncGate from '@shared/react/AsyncGate'
import { renderError } from '@shared/react/render-error'
import { useAsyncData } from '@shared/react/useAsyncData'
import { loadRessource, type RessourcePorts } from '@shared/screens/ressource'
import RechercheDePlan from './components/RechercheDePlan'

export default function App(ports: RessourcePorts) {
    const state = useAsyncData(() => loadRessource(ports))

    return (
        <main className="app">
            <AsyncGate state={state} renderError={renderError}>
                {(screen) => <RechercheDePlan {...screen} />}
            </AsyncGate>
        </main>
    )
}
