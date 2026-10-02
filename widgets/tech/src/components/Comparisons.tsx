import { useState } from 'react'
import { RadioGroup, type RadioOption } from '@shared/react/components/Radio'
import DocComparison from './DocComparison'
import StateComparison from './StateComparison'
import RawResultView from './RawResultView'
import CreatedTables from './CreatedTables'

export type RawResult =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'done'; value: unknown }

type ComparisonKind = 'states' | 'documents'

const COMPARISON_KINDS: readonly RadioOption<ComparisonKind>[] = [
    { value: 'states', label: 'Deux états' },
    { value: 'documents', label: 'Deux documents' },
]

export default function Comparisons() {
    const [kind, setKind] = useState<ComparisonKind>('states')
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
            <RadioGroup
                legend="Comparer"
                options={COMPARISON_KINDS}
                value={kind}
                onChange={setKind}
                inline
            />
            {kind === 'states' && (
                <StateComparison
                    updateRawResultOnRequest={updateRawResultOnRequest}
                />
            )}
            {kind === 'documents' && (
                <DocComparison
                    updateRawResultOnRequest={updateRawResultOnRequest}
                />
            )}
            <RawResultView result={rawResult} />
            {rawResult.status === 'done' && (
                <CreatedTables comparison={rawResult.value} />
            )}
        </>
    )
}
