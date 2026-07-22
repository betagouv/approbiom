import Tag from '@shared/components/Tag'

// Keyed by what the document stores. A value that is not in here — the column is
// free text — gets no colour, and the tag comes out neutral grey.
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
