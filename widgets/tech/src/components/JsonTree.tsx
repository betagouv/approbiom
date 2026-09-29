interface JsonTreeProps {
    value: unknown
    name?: string
}

function describe(value: object): string {
    if (Array.isArray(value)) return `[${value.length}]`
    return `{${Object.keys(value).length}}`
}

export default function JsonTree({ value, name }: JsonTreeProps) {
    const label =
        name === undefined ? null : <span className="json-key">{name} : </span>

    if (value === null || typeof value !== 'object') {
        return (
            <div className="json-leaf">
                {label}
                <span className="json-value">{JSON.stringify(value)}</span>
            </div>
        )
    }

    const entries: [string, unknown][] = Object.entries(value)
    return (
        <details className="json-node">
            <summary>
                {label}
                <span className="json-count">{describe(value)}</span>
            </summary>
            {entries.map(([key, child]) => (
                <JsonTree key={key} name={key} value={child} />
            ))}
        </details>
    )
}
