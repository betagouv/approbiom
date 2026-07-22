import Tag from '@shared/components/Tag'

// « abandonné » is left out on purpose: a plan that went nowhere has nothing to
// draw the eye to, and its grey is what makes the others stand out.
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
