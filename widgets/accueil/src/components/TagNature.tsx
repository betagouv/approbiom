import Tag from '@shared/user-interface/component/Tag'

// A prévision is the ordinary case, so it stays grey; a constat is the one worth
// spotting — the figure has been measured rather than announced.
const COLOR: Record<string, string> = {
    constat: 'blue-ecume',
}

export default function TagNature({ nature }: { nature: string }) {
    return (
        <Tag color={COLOR[nature]} size="sm">
            {nature}
        </Tag>
    )
}
