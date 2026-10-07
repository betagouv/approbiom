import Tabs from '@shared/react/components/Tabs'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { Referentiels } from '../../approvisionnement-rows'
import PlanHeader from '../PlanHeader'
import type { SelectablePlan } from '../ScreenSelectPlan'
import TabApprovisionnement from './TabApprovisionnement'
import TabSynthese from './TabSynthese'

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
    const planApprovisionnements = approvisionnements.filter(
        ({ planDApprovisionnement }) => planDApprovisionnement === plan.id
    )
    const hasAttachments = attachments.some(
        ({ planDApprovisionnement }) => planDApprovisionnement === plan.id
    )
    const count = planApprovisionnements.length

    return (
        <>
            <PlanHeader plan={plan} onChangePlan={onChangePlan} />
            <Tabs
                label="Vues des approvisionnements"
                items={[
                    {
                        id: 'approvisionnements',
                        label:
                            count > 0
                                ? `Approvisionnements (${count})`
                                : 'Approvisionnements',
                        content: (
                            <TabApprovisionnement
                                approvisionnements={planApprovisionnements}
                                hasAttachments={hasAttachments}
                                {...referentiels}
                            />
                        ),
                    },
                    {
                        id: 'synthese',
                        label: 'Synthèse',
                        content: (
                            <TabSynthese
                                approvisionnements={planApprovisionnements}
                                hasAttachments={hasAttachments}
                                {...referentiels}
                            />
                        ),
                    },
                ]}
            />
        </>
    )
}
