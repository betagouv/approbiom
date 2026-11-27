import Tag from '@shared/react/ui/components/Tag'
import type { PlanDApprovisionnement } from '@shared/core/domain/entities/plan-d-approvisionnement'

const COLOR: Record<string, string> = {
    création: 'yellow-tournesol',
    modification: 'pink-tuile',
}

export default function TagTypeDePlan({
    typeDePlan,
}: {
    typeDePlan: PlanDApprovisionnement['typeDePlan']
}) {
    return (
        <Tag color={COLOR[typeDePlan]} size="sm">
            {typeDePlan}
        </Tag>
    )
}
