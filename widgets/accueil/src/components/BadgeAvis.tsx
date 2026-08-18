import Badge from '@shared/react/components/Badge'
import type { AvisCRB } from '@shared/core/domain/value-objects/avis-crb'
import type { AvisPrefet } from '@shared/core/domain/value-objects/avis-prefet'

const COLOR: Record<string, string> = {
    'Avis favorable': 'green-emeraude',
    'Avis favorable avec réserves': 'green-menthe',
    'Avis réservé': 'yellow-moutarde',
    'Avis défavorable': 'pink-tuile',
}

export default function BadgeAvis({ avis }: { avis: AvisCRB | AvisPrefet }) {
    return (
        <Badge color={COLOR[avis]} size="sm">
            {avis}
        </Badge>
    )
}
