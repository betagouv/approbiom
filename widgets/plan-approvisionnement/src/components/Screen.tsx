import { useState } from 'react'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { Pays } from '@shared/core/domain/value-objects/pays'
import type { Referentiels } from '../approvisionnement-rows'
import ScreenSelectPlan, { type SelectablePlan } from './ScreenSelectPlan'
import ScreenPlanApprovisionnement from './ScreenPlanApprovisionnement'

export type ScreenProps = Referentiels & {
    plans: readonly SelectablePlan[]
    approvisionnements: readonly Approvisionnement[]
    attachments: readonly Attachment[]
    pays: readonly Pays[]
    updateApprovisionnement: (
        id: Approvisionnement['id'],
        approvisionnement: Partial<Approvisionnement>
    ) => Promise<void>
    deleteApprovisionnement: (id: Approvisionnement['id']) => Promise<void>
}

export default function Screen({
    plans,
    approvisionnements: initialApprovisionnements,
    updateApprovisionnement,
    deleteApprovisionnement,
    ...data
}: ScreenProps) {
    const [planId, setPlanId] = useState<SelectablePlan['id'] | null>(null)
    // True while another plan is being looked for.
    const [picking, setPicking] = useState(false)
    // Kept in step with the table: changed once it has been written.
    const [approvisionnements, setApprovisionnements] = useState(
        initialApprovisionnements
    )

    const plan = plans.find(({ id }) => id === planId)

    function selectPlan(id: SelectablePlan['id']) {
        setPlanId(id)
        setPicking(false)
    }

    async function update(
        id: Approvisionnement['id'],
        changes: Partial<Approvisionnement>
    ) {
        await updateApprovisionnement(id, changes)
        setApprovisionnements((previous) =>
            previous.map((approvisionnement) =>
                approvisionnement.id === id
                    ? { ...approvisionnement, ...changes }
                    : approvisionnement
            )
        )
    }

    async function remove(id: Approvisionnement['id']) {
        await deleteApprovisionnement(id)
        setApprovisionnements((previous) =>
            previous.filter((approvisionnement) => approvisionnement.id !== id)
        )
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
            approvisionnements={approvisionnements}
            onChangePlan={() => setPicking(true)}
            onUpdate={update}
            onDelete={remove}
            {...data}
        />
    )
}
