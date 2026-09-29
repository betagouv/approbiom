import { useState } from 'react'

export type RawResult =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'done'; value: unknown }

export function useRawResult() {
    const [result, setResult] = useState<RawResult>({ status: 'idle' })

    async function show(request: () => Promise<unknown>) {
        setResult({ status: 'loading' })
        try {
            setResult({ status: 'done', value: await request() })
        } catch (error) {
            setResult({ status: 'error', message: String(error) })
        }
    }

    return { result, show }
}
