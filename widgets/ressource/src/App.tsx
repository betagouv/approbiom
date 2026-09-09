import AsyncGate from '@shared/react/AsyncGate'
import { useAsyncState } from '@shared/react/UseAsyncState'
import type { InstallationPort } from '@shared/core/application/ports/installation'
import type { PlanPort } from '@shared/core/application/ports/plan-d-approvisionnement'
import RechercheDePlan, {
    type RechercheDePlanProps,
} from './components/RechercheDePlan'

export type RessourceProps = Omit<
    RechercheDePlanProps,
    'plans' | 'installations'
> & {
    plans: PlanPort
    installations: InstallationPort
}

export default function App({
    plans,
    installations,
    ...sources
}: RessourceProps) {
    const state = useAsyncState(() =>
        Promise.all([plans.list(), installations.list()])
    )

    return (
        <main className="app">
            <AsyncGate state={state}>
                {([plans, installations]) => (
                    <RechercheDePlan
                        plans={plans}
                        installations={installations}
                        {...sources}
                    />
                )}
            </AsyncGate>
        </main>
    )
}
