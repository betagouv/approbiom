import { useState } from 'react'
import ScreenSelectPlan, { type SelectablePlan } from './ScreenSelectPlan'
import ScreenPlanApprovisionnement from './ScreenPlanApprovisionnement'

export type ScreenProps = {
    plans: readonly SelectablePlan[]
}

export default function Screen({ plans }: ScreenProps) {
    const [planId, setPlanId] = useState<SelectablePlan['id'] | null>(null)
    // True while another plan is being looked for.
    const [picking, setPicking] = useState(false)

    const plan = plans.find(({ id }) => id === planId)

    function selectPlan(id: SelectablePlan['id']) {
        setPlanId(id)
        setPicking(false)
    }

    if (!plan || picking)
        return (
            <ScreenSelectPlan
                plans={plans}
                current={plan}
                onSelect={selectPlan}
                onCancel={() => setPicking(false)}
            />
        )

    return (
        <ScreenPlanApprovisionnement
            plan={plan}
            onChangePlan={() => setPicking(true)}
        />
    )
}
