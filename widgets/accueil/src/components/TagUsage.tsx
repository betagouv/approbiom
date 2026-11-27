import Tag from '@shared/react/ui/components/Tag'

const COLOR: Record<string, string> = {
    énergie: 'blue-ecume',
    matériau: 'purple-glycine',
    chimie: 'blue-cumulus',
}

export default function TagUsage({ usage }: { usage: string }) {
    return (
        <Tag color={COLOR[usage]} size="sm">
            {usage}
        </Tag>
    )
}
