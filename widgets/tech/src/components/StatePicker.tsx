import { useRef } from 'react'
import type { HistoryState } from '@shared/infrastructure/grist/helpers/grist-document-states'

interface StatePickerProps {
    states?: HistoryState[]
    error: string
    onSelect: (actionHash: string) => void
}

function StateList({ states, error, onSelect }: StatePickerProps) {
    if (error) return <p className="fr-error-text">{error}</p>
    if (!states) return <p>Chargement…</p>
    return (
        <ul className="state-picker__list">
            {states.map(({ actionNum, actionHash, time }) => (
                <li key={actionHash}>
                    <button
                        type="button"
                        className="state-picker__option"
                        onClick={() => onSelect(actionHash)}
                    >
                        <span className="state-picker__time">
                            {time?.toLocaleString('fr-FR') ?? 'date inconnue'}
                            {` · n° ${actionNum}`}
                        </span>
                        <code>{actionHash}</code>
                    </button>
                </li>
            ))}
        </ul>
    )
}

export default function StatePicker(props: StatePickerProps) {
    const detailsRef = useRef<HTMLDetailsElement>(null)

    function select(actionHash: string) {
        props.onSelect(actionHash)
        if (detailsRef.current) detailsRef.current.open = false
    }

    return (
        <details ref={detailsRef} className="state-picker fr-mt-1w">
            <summary>
                Choisir un état dans l&apos;historique de ce document
            </summary>
            <div className="state-picker__panel">
                <p className="fr-hint-text fr-mb-1w">
                    Source : table <code>_gristsys_ActionHistory</code> du
                    document, du plus récent au plus ancien.
                    {props.states && ` ${props.states.length} états.`}
                </p>
                <StateList {...props} onSelect={select} />
            </div>
        </details>
    )
}
