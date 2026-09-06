import '@gouvfr/dsfr/dist/core/core.main.min.css'
import AsyncGate from '@shared/react/AsyncGate'
import { useAsyncState } from '@shared/react/UseAsyncState'
import Import from './components/Import'

export default function App() {
    const state = useAsyncState(() => Promise.resolve())
    return (
        <main className="app">
            <AsyncGate state={state}>{() => <Import />}</AsyncGate>
        </main>
    )
}
