import './RechercheDePlan.css'
import SearchBar from '@shared/react/components/SearchBar'
import Ressource from '@shared/react/components/Ressource'
import AsyncGate from '@shared/react/AsyncGate'
import { renderError } from '@shared/react/render-error'
import { useAsyncData } from '@shared/react/useAsyncData'
import {
    getApprovisionnementStats,
    type ApprovisionnementStatsPorts,
} from '@shared/core/application/services/approvisionnement-stats'
import type { PlanDApprovisionnement as Plan } from '@shared/core/domain/entities/plan-d-approvisionnement'

import { useState } from 'react'

/** The statistics of the picked plan, read once it is picked. */
function Statistiques({
    ports,
    plan,
}: {
    ports: ApprovisionnementStatsPorts
    plan: Plan['id']
}) {
    const state = useAsyncData(() => getApprovisionnementStats(ports, plan))

    return (
        <AsyncGate state={state} renderError={renderError}>
            {(stats) => <Ressource {...stats} />}
        </AsyncGate>
    )
}

export type RechercheDePlanProps = {
    plans: readonly Plan[]
    ports: ApprovisionnementStatsPorts
}

export default function RechercheDePlan({
    plans,
    ports,
}: RechercheDePlanProps) {
    const [plan, setPlan] = useState<Plan['id'] | null>(null)

    const planOptions = plans.map((plan) => ({
        value: plan.id,
        label: plan.nom || `Plan ${plan.id}`,
    }))

    return (
        <div className="recherche-de-plan fr-p-2w">
            <SearchBar
                label="Rechercher un plan d’approvisionnement"
                placeholder="Rechercher un plan d’approvisionnement"
                options={planOptions}
                onSelect={setPlan}
            />

            {plan !== null && (
                <Statistiques key={plan} ports={ports} plan={plan} />
            )}
        </div>
    )
}
