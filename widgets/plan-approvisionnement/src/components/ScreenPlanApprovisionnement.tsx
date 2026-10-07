import PlanHeader from './PlanHeader'
import type { SelectablePlan } from './ScreenSelectPlan'

export type ScreenPlanApprovisionnementProps = {
    plan: SelectablePlan
    onChangePlan: () => void
}

export default function ScreenPlanApprovisionnement({
    plan,
    onChangePlan,
}: ScreenPlanApprovisionnementProps) {
    return <PlanHeader plan={plan} onChangePlan={onChangePlan} />
}
