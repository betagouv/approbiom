import AsyncGate from '@shared/user-interface/utils/AsyncGate'
import { renderError } from '@shared/user-interface/utils/render-error'
import { useAsyncData } from '@shared/user-interface/utils/useAsyncData'
import {
    loadRessource,
    type RessourcePorts,
} from '@shared/user-interface/screen/ressource'
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
