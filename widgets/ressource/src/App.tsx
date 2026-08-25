import AsyncGate from '@shared/react/AsyncGate'
import { renderError } from '@shared/react/render-error'
import { useAsyncData } from '@shared/react/useAsyncData'
import type { PlanPort } from '@shared/core/application/ports/plan-d-approvisionnement'
import RechercheDePlan, {
    type RechercheDePlanProps,
} from './components/RechercheDePlan'

export type RessourceProps = Omit<RechercheDePlanProps, 'plans'> & {
    plans: PlanPort
}

export default function App({ plans, ...sources }: RessourceProps) {
    const state = useAsyncData(() => plans.list())

    return (
        <main className="app">
            <AsyncGate state={state} renderError={renderError}>
                {(plans) => <RechercheDePlan plans={plans} {...sources} />}
            </AsyncGate>
        </main>
    )
}
