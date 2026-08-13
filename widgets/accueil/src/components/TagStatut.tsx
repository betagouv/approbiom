import Tag from '@shared/user-interface/component/Tag'

const COLOR: Record<string, string> = {
    projet: 'purple-glycine',
    'en fonctionnement': 'green-emeraude',
    obsolète: 'yellow-moutarde',
}

export default function TagStatut({ statut }: { statut: string }) {
    return (
        <Tag color={COLOR[statut]} size="sm">
            {statut}
        </Tag>
    )
}
