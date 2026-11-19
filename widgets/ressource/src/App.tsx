import AsyncGate from '@shared/react/components/AsyncGate'
import { useAsyncState } from '@shared/react/hooks/UseAsyncState'
import RechercheDePlan, {
    type RechercheDePlanProps,
} from './components/RechercheDePlan'
import { loadRessource, type RessourcePorts } from './load-ressource'

export type RessourceProps = Omit<
    RechercheDePlanProps,
    'plans' | 'installations'
> &
    RessourcePorts

export default function App({
    plans,
    installations,
    ...sources
}: RessourceProps) {
    const state = useAsyncState(() => loadRessource({ plans, installations }))

    return (
        <main className="widget-ressource">
            <AsyncGate state={state}>
                {(screen) => <RechercheDePlan {...screen} {...sources} />}
            </AsyncGate>
        </main>
    )
}
