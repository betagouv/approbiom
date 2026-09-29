import { useEffect, useState, type SubmitEvent } from 'react'
import { compareDocs, getCurrentDocId } from '../doc-history'
import CopyableValue from './CopyableValue'
import EndpointDoc from './EndpointDoc'
import RawResultView from './RawResultView'
import { useRawResult } from './useRawResult'

export default function DocComparison() {
    const [currentDocId, setCurrentDocId] = useState('')
    const [leftDocId, setLeftDocId] = useState('')
    const [rightDocId, setRightDocId] = useState('')
    const { result, show } = useRawResult()

    useEffect(() => {
        getCurrentDocId()
            .then(setCurrentDocId)
            .catch(() => undefined)
    }, [])

    function handleSubmit(event: SubmitEvent) {
        event.preventDefault()
        void show(() => compareDocs(leftDocId.trim(), rightDocId.trim()))
    }

    return (
        <>
            <CopyableValue label="Id du document actuel" value={currentDocId} />
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
            <EndpointDoc
                endpoint="GET /docs/{docId}/compare/{docId2}"
                operationId="compareDocuments"
            />
            <RawResultView result={result} />
        </>
    )
}
