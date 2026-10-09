import './Extraction.css'

import { useEffect, useEffectEvent, useRef, useState } from 'react'
import ExtractionFailure from './ExtractionFailure'
import ExtractionLoading from './ExtractionLoading'

export type ExtractionProps<T> = {
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

    // React runs effects twice in development: one attempt must extract once,
    // or the lines would be written twice.
    const running = useRef<{ attempt: number; result: Promise<T> } | null>(null)

    const runExtract = useEffectEvent(() => {
        if (running.current?.attempt !== attempt)
            running.current = { attempt, result: extract() }

        return running.current.result
    })
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
