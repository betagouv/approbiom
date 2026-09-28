import './Extraction.css'

import { useEffect, useEffectEvent, useState } from 'react'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { ExtractedLine } from '@shared/infrastructure/import-bcib-bciat/helpers'
import type { SelectablePlan } from '../selection'
import type { ExtractionStatus } from './extraction.types'
import ImportContext from '../import-context'
import ExtractionFailure from './ExtractionFailure'
import ExtractionLoading from './ExtractionLoading'
import ExtractionSuccess from './ExtractionSuccess'

export type ExtractionProps<L extends ExtractedLine> = {
    plan: SelectablePlan
    attachment: Attachment
    extract: (
        attachment: Attachment
    ) => Promise<{ lines: readonly L[]; date: Date }>
    onExtracted: (data: { lines: readonly L[]; date: Date }) => void
    onBack: () => void
}

export default function Extraction<L extends ExtractedLine>({
    plan,
    attachment,
    extract,
    onExtracted,
    onBack,
}: ExtractionProps<L>) {
    const [attempt, setAttempt] = useState(0)
    const [extractionStatus, setExtractionStatus] = useState<ExtractionStatus>({
        status: 'loading',
    })

    const runExtract = useEffectEvent(extract)
    const reportExtracted = useEffectEvent(onExtracted)

    useEffect(() => {
        // A result arriving after the document changed, or after a newer
        // attempt started, is dropped.
        let cancelled = false

        runExtract(attachment).then(
            (data) => {
                if (cancelled) return

                setExtractionStatus({ status: 'success', ...data })
                reportExtracted(data)
            },
            (error: unknown) => {
                if (cancelled) return

                setExtractionStatus({
                    status: 'error',
                    message:
                        error instanceof Error ? error.message : String(error),
                })
            }
        )

        return () => {
            cancelled = true
        }
    }, [attachment, attempt])

    function retry() {
        setExtractionStatus({ status: 'loading' })
        setAttempt((previous) => previous + 1)
    }

    return (
        <div className="extraction">
            <ImportContext plan={plan} attachment={attachment} />

            {extractionStatus.status === 'loading' && <ExtractionLoading />}

            {extractionStatus.status === 'error' && (
                <ExtractionFailure
                    message={extractionStatus.message}
                    onRetry={retry}
                    onBack={onBack}
                />
            )}

            {extractionStatus.status === 'success' && (
                <ExtractionSuccess
                    lineCount={extractionStatus.lines.length}
                    date={extractionStatus.date}
                />
            )}
        </div>
    )
}
