import { useState } from 'react'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { Referentiels } from '../approvisionnement-rows'
import ScreenSelectPlan, { type SelectablePlan } from './ScreenSelectPlan'
import ScreenPlanApprovisionnement from './ScreenPlanApprovisionnement'

export type ScreenProps = Referentiels & {
    plans: readonly SelectablePlan[]
    approvisionnements: readonly Approvisionnement[]
    attachments: readonly Attachment[]
}

export default function Screen({ plans, ...data }: ScreenProps) {
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
            // Another plan starts on its first tab, with no filter left on.
            key={plan.id}
            plan={plan}
            onChangePlan={() => setPicking(true)}
            {...data}
        />
    )
}
