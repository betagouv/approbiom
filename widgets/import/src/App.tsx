import AsyncGate from '@shared/react/AsyncGate'
import { useAsyncState } from '@shared/react/UseAsyncState'

export default function App() {
    const state = useAsyncState(() => Promise.resolve())
    return (
        <main className="app">
            <AsyncGate state={state}>{() => <p>Hello world</p>}</AsyncGate>
        </main>
    )
}
