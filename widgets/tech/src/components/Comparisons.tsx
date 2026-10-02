import { useState } from 'react'
import StateComparison from './StateComparison'
import RawResultView from './RawResultView'
import ResultView from './ResultView'

export type RawResult =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'done'; value: unknown }

export default function Comparisons() {
    const [rawResult, setRawResult] = useState<RawResult>({ status: 'idle' })
    async function updateRawResultOnRequest(request: () => Promise<unknown>) {
        setRawResult({ status: 'loading' })
        try {
            setRawResult({ status: 'done', value: await request() })
        } catch (error) {
            setRawResult({ status: 'error', message: String(error) })
        }
    }
    return (
        <>
            <StateComparison
                updateRawResultOnRequest={updateRawResultOnRequest}
            />
            <RawResultView result={rawResult} />
            {rawResult.status === 'done' && (
                <ResultView comparison={rawResult.value} />
            )}
        </>
    )
}
