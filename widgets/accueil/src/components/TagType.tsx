import Tag from '@shared/user-interface/component/Tag'

const COLOR: Record<string, string> = {
    création: 'yellow-tournesol',
    modification: 'pink-tuile',
}

export default function TagType({ type }: { type: string }) {
    return (
        <Tag color={COLOR[type]} size="sm">
            {type}
        </Tag>
    )
}
