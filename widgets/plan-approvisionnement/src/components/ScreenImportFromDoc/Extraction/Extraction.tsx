import './Extraction.css'

import { useEffect, useEffectEvent, useState } from 'react'
import ExtractionFailure from './ExtractionFailure'
import ExtractionLoading from './ExtractionLoading'

export type ExtractionProps<T> = {
    // Runs the extraction; called again by « Recommencer l'extraction ».
    extract: () => Promise<T>
    onExtracted: (result: T) => void
    onChooseAnother: () => void
}

export default function Extraction<T>({
    extract,
    onExtracted,
    onChooseAnother,
}: ExtractionProps<T>) {
    const [attempt, setAttempt] = useState(0)
    const [failure, setFailure] = useState<string | null>(null)

    const runExtract = useEffectEvent(extract)
    const reportExtracted = useEffectEvent(onExtracted)

    useEffect(() => {
        // A result arriving after a newer attempt started is dropped.
        let cancelled = false

        runExtract().then(
            (result) => {
                if (!cancelled) reportExtracted(result)
            },
            (error: unknown) => {
                if (!cancelled)
                    setFailure(
                        error instanceof Error ? error.message : String(error)
                    )
            }
        )

        return () => {
            cancelled = true
        }
    }, [attempt])

    if (failure === null) return <ExtractionLoading />

    return (
        <ExtractionFailure
            message={failure}
            onRetry={() => {
                setFailure(null)
                setAttempt((previous) => previous + 1)
            }}
            onBack={onChooseAnother}
        />
    )
}
