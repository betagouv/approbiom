import AsyncGate from '@shared/react/AsyncGate'
import { useAsyncState } from '@shared/react/UseAsyncState'
import Concurrence from './components/Concurrence'
import { loadConcurrence, type ConcurrencePorts } from './load-concurrence'

export default function App(ports: ConcurrencePorts) {
    const state = useAsyncState(() => loadConcurrence(ports))

    return (
        <main className="app">
            <AsyncGate state={state}>
                {(screen) => (
                    <Concurrence
                        {...screen}
                        getCommuneCenterPosition={
                            ports.localization.getCommuneCenterPosition
                        }
                        getDepartementContour={
                            ports.localization.getDepartementContour
                        }
                        getCountryContour={ports.localization.getCountryContour}
                    />
                )}
            </AsyncGate>
        </main>
    )
}
