import type { RowRecord } from 'grist/GristData'
import { gristReady } from '@shared/infrastructure/grist/grist-ready'
import { LOADING } from './UseAsyncState'
import type { AsyncState, UseAsyncState } from './UseAsyncState'
import { useCallback, useEffect, useRef, useState } from 'react'

type Listener = {
    onRecord: (record: RowRecord | null) => void
    onError: (error: Error) => void
}

const listeners = new Set<Listener>()

// `undefined` is "the cursor has not reported yet", `null` is "the cursor is on
// no row". Collapsing them would announce an empty selection before Grist has
// answered at all.
let current: RowRecord | null | undefined
let failure: Error | undefined
let watching = false

function publish(record: RowRecord | null): void {
    current = record
    failure = undefined

    for (const { onRecord } of listeners) onRecord(record)
}

function fail(cause: unknown): void {
    failure = cause instanceof Error ? cause : new Error(String(cause))

    for (const { onError } of listeners) onError(failure)
}

function watch(): void {
    if (watching) return
    watching = true
    failure = undefined

    void gristReady().then(
        () => {
            // `grist.onRecord` offers no way to unregister, so it is registered
            // once for the life of the page and fans out to listeners that can
            // be removed.
            grist.onRecord(publish)
        },
        (cause: unknown) => {
            // A refused handshake is worth another attempt: the user can grant
            // access in the widget panel and retry.
            watching = false
            fail(cause)
        }
    )
}

function subscribe(listener: Listener): () => void {
    listeners.add(listener)

    watch()

    if (failure !== undefined) listener.onError(failure)
    else if (current !== undefined) listener.onRecord(current)

    return () => {
        listeners.delete(listener)
    }
}

/**
 * The row the Grist cursor is on, read through `toValue`, as loading / ready /
 * error — the same three states `useAsyncState` reports for a fetch.
 */
export function useGristSubscription<T>(
    toValue: (record: RowRecord | null) => Promise<T>
): UseAsyncState<T> {
    const [state, setState] = useState<AsyncState<T>>(LOADING)
    const [attempt, setAttempt] = useState(0)

    // Same reason as `useAsyncState`: an inline arrow is a new function on every
    // render and would resubscribe endlessly. `attempt` is what decides when to
    // subscribe again.
    const toValueRef = useRef(toValue)
    toValueRef.current = toValue

    useEffect(() => {
        let latest = 0

        return subscribe({
            onRecord: (record) => {
                const token = ++latest

                void toValueRef.current(record).then(
                    (data) => {
                        // The cursor can move on while a row is being read; only
                        // the newest one may land.
                        if (token !== latest) return

                        setState({ status: 'ready', data, error: null })
                    },
                    (cause: unknown) => {
                        if (token !== latest) return

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
            },
            onError: (error) =>
                setState({ status: 'error', data: null, error }),
        })
    }, [attempt])

    const refresh = useCallback(
        () => setAttempt((previous) => previous + 1),
        []
    )

    const retry = useCallback(() => {
        setState(LOADING)
        setAttempt((previous) => previous + 1)
    }, [])

    return { ...state, retry, refresh }
}
