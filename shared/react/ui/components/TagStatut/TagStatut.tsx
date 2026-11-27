import Tag from '@shared/react/ui/components/Tag'
import type { PlanDApprovisionnement } from '@shared/core/domain/entities/plan-d-approvisionnement'

const COLOR: Record<string, string> = {
    projet: 'purple-glycine',
    'en fonctionnement': 'green-emeraude',
    obsolète: 'yellow-moutarde',
}

export default function TagStatut({
    statut,
}: {
    statut: PlanDApprovisionnement['statut']
}) {
    return (
        <Tag color={COLOR[statut]} size="sm">
            {statut}
        </Tag>
    )
}
