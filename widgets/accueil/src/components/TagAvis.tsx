import Tag from '@shared/components/Tag'
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

export default function TagAvis({ avis }: { avis: AvisCRB | AvisPrefet }) {
    return (
        <Tag color={COLOR[avis]} size="sm">
            {avis}
        </Tag>
    )
}
