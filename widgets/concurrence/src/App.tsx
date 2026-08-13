import AsyncGate from '@shared/user-interface/utils/AsyncGate'
import { renderError } from '@shared/user-interface/utils/render-error'
import { useAsyncData } from '@shared/user-interface/utils/useAsyncData'
import Concurrence from './components/Concurrence'
import { loadConcurrence, type ConcurrencePorts } from './load-concurrence'

export default function App(ports: ConcurrencePorts) {
    const state = useAsyncData(() => loadConcurrence(ports))

    return (
        <main className="app">
            <AsyncGate state={state} renderError={renderError}>
                {(screen) => <Concurrence {...screen} />}
            </AsyncGate>
        </main>
    )
}
