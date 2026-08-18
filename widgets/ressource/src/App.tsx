import AsyncGate from '@shared/user-interface/utils/AsyncGate'
import { renderError } from '@shared/user-interface/utils/render-error'
import { useAsyncData } from '@shared/user-interface/utils/useAsyncData'
import type { PlanQuery } from '@shared/core/application/ports/plan-d-approvisionnement'
import type { ApprovisionnementStatsPorts } from '@shared/core/application/services/approvisionnement-stats'
import RechercheDePlan from './components/RechercheDePlan'

export type RessourcePorts = ApprovisionnementStatsPorts & {
    plans: PlanQuery
}

export default function App(ports: RessourcePorts) {
    const state = useAsyncData(() => ports.plans.list())

    return (
        <main className="app">
            <AsyncGate state={state} renderError={renderError}>
                {(plans) => <RechercheDePlan plans={plans} ports={ports} />}
            </AsyncGate>
        </main>
    )
}
