import { useEffect, useState, type SubmitEvent } from 'react'

import StatePicker from './StatePicker'
import {
    compareStates,
    listHistoryStates,
    type HistoryState,
} from '@shared/infrastructure/grist/helpers/grist-document-states'

type Props = {
    updateRawResultOnRequest: (request: () => Promise<unknown>) => Promise<void>
}

export default function StateComparison({ updateRawResultOnRequest }: Props) {
    const [leftActionHash, setLeftActionHash] = useState('')
    const [rightActionHash, setRightActionHash] = useState('HEAD')
    const [historyStates, setHistoryStates] = useState<HistoryState[]>()
    const [historyError, setHistoryError] = useState('')

    useEffect(() => {
        listHistoryStates()
            .then(setHistoryStates)
            .catch((error: unknown) => setHistoryError(String(error)))
    }, [])

    function handleSubmit(event: SubmitEvent) {
        event.preventDefault()
        void updateRawResultOnRequest(() =>
            compareStates(leftActionHash.trim(), rightActionHash.trim())
        )
    }

    return (
        <>
            <form onSubmit={handleSubmit}>
                <div className="fr-input-group">
                    <label className="fr-label" htmlFor="left-action-hash">
                        État de départ (hash)
                    </label>
                    <input
                        className="fr-input"
                        id="left-action-hash"
                        value={leftActionHash}
                        onChange={(event) =>
                            setLeftActionHash(event.target.value)
                        }
                        required
                    />
                    <StatePicker
                        states={historyStates}
                        error={historyError}
                        onSelect={setLeftActionHash}
                    />
                </div>
                <div className="fr-input-group">
                    <label className="fr-label" htmlFor="right-action-hash">
                        État d’arrivée (hash)
                        <span className="fr-hint-text">
                            HEAD pour l’état actuel
                        </span>
                    </label>
                    <input
                        className="fr-input"
                        id="right-action-hash"
                        value={rightActionHash}
                        onChange={(event) =>
                            setRightActionHash(event.target.value)
                        }
                        required
                    />
                    <StatePicker
                        states={historyStates}
                        error={historyError}
                        onSelect={setRightActionHash}
                    />
                </div>
                <button className="fr-btn" type="submit">
                    Comparer
                </button>
            </form>
        </>
    )
}
