import Badge from '@shared/user-interface/component/Badge'
import type {
    AvisCRB,
    AvisPrefet,
} from '@shared/application/domain/instruction'

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
