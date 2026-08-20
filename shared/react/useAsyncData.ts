import { useCallback, useEffect, useRef, useState } from 'react'

export type AsyncState<T> =
    | { status: 'loading'; data: null; error: null }
    | { status: 'ready'; data: T; error: null }
    | { status: 'error'; data: null; error: Error }

export type UseAsyncDataResult<T> = AsyncState<T> & {
    retry: () => void
    refresh: () => void
}

type Read = {
    attempt: number
    keepData: boolean
}

const LOADING = { status: 'loading', data: null, error: null } as const

export function useAsyncData<T>(load: () => Promise<T>): UseAsyncDataResult<T> {
    const [state, setState] = useState<AsyncState<T>>(LOADING)
    const [read, setRead] = useState<Read>({ attempt: 0, keepData: false })

    const retry = useCallback(
        () =>
            setRead(({ attempt }) => ({
                attempt: attempt + 1,
                keepData: false,
            })),
        []
    )

    const refresh = useCallback(
        () =>
            setRead(({ attempt }) => ({
                attempt: attempt + 1,
                keepData: true,
            })),
        []
    )

    // `load` is read through a ref rather than from the dependency array: an
    // inline arrow is a new function on every render and would restart the read
    // endlessly. `read` is what decides when to read again.
    const loadRef = useRef(load)
    loadRef.current = load

    useEffect(() => {
        let cancelled = false

        if (!read.keepData)
            setState((previous) =>
                previous.status === 'loading' ? previous : LOADING
            )

        loadRef.current().then(
            (data) => {
                if (!cancelled) setState({ status: 'ready', data, error: null })
            },
            (cause: unknown) => {
                if (cancelled) return

                setState({
                    status: 'error',
                    data: null,
                    error:
                        cause instanceof Error
                            ? cause
                            : new Error(String(cause)),
                })
            }
        )

        return () => {
            cancelled = true
        }
    }, [read])

    return { ...state, retry, refresh }
}
