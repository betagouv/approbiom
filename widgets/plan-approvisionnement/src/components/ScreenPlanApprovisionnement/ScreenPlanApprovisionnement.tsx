import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { Referentiels } from '../../approvisionnement-rows'
import PlanHeader from '../PlanHeader'
import type { SelectablePlan } from '../ScreenSelectPlan'
import TabApprovisionnement from './TabApprovisionnement'

export type ScreenPlanApprovisionnementProps = Referentiels & {
    plan: SelectablePlan
    // Those of every plan: the screen keeps the plan's own.
    approvisionnements: readonly Approvisionnement[]
    attachments: readonly Attachment[]
    onChangePlan: () => void
}

export default function ScreenPlanApprovisionnement({
    plan,
    approvisionnements,
    attachments,
    onChangePlan,
    ...referentiels
}: ScreenPlanApprovisionnementProps) {
    return (
        <>
            <PlanHeader plan={plan} onChangePlan={onChangePlan} />
            <TabApprovisionnement
                approvisionnements={approvisionnements.filter(
                    ({ planDApprovisionnement }) =>
                        planDApprovisionnement === plan.id
                )}
                hasAttachments={attachments.some(
                    ({ planDApprovisionnement }) =>
                        planDApprovisionnement === plan.id
                )}
                {...referentiels}
            />
        </>
    )
}
