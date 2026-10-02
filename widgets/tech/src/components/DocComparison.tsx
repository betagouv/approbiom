import { useState, type SubmitEvent } from 'react'
import { compareDocs } from '../doc-history'

type Props = {
    updateRawResultOnRequest: (request: () => Promise<unknown>) => Promise<void>
}

export default function DocComparison({ updateRawResultOnRequest }: Props) {
    const [leftDocId, setLeftDocId] = useState('')
    const [rightDocId, setRightDocId] = useState('')
    function handleSubmit(event: SubmitEvent) {
        event.preventDefault()
        void updateRawResultOnRequest(() =>
            compareDocs(leftDocId.trim(), rightDocId.trim())
        )
    }

    return (
        <>
            <form onSubmit={handleSubmit}>
                <div className="fr-input-group">
                    <label className="fr-label" htmlFor="left-doc-id">
                        Id du premier document
                    </label>
                    <input
                        className="fr-input"
                        id="left-doc-id"
                        value={leftDocId}
                        onChange={(event) => setLeftDocId(event.target.value)}
                        required
                    />
                </div>
                <div className="fr-input-group">
                    <label className="fr-label" htmlFor="right-doc-id">
                        Id du second document
                    </label>
                    <input
                        className="fr-input"
                        id="right-doc-id"
                        value={rightDocId}
                        onChange={(event) => setRightDocId(event.target.value)}
                        required
                    />
                </div>
                <button className="fr-btn" type="submit">
                    Comparer
                </button>
            </form>
        </>
    )
}
