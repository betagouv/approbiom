import AsyncGate from '@shared/react/components/AsyncGate'

import Concurrence from './components/Concurrence'
import { loadConcurrence, type ConcurrencePorts } from './load-concurrence'
import { useAsyncState } from '@shared/react/hooks/UseAsyncState'

export default function App(ports: ConcurrencePorts) {
    const state = useAsyncState(() => loadConcurrence(ports))

    return (
        <main className="app">
            <AsyncGate state={state}>
                {(screen) => (
                    <Concurrence
                        {...screen}
                        getCommuneCenterPosition={
                            ports.referentielGeo.getCommuneCenterPosition
                        }
                        getDepartementContour={
                            ports.referentielGeo.getDepartementContour
                        }
                        getCountryContour={
                            ports.referentielGeo.getCountryContour
                        }
                    />
                )}
            </AsyncGate>
        </main>
    )
}
