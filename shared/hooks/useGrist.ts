import {
    getApprobiomTables,
    type FetchedData,
    type TableSpec,
} from '@shared/grist/approbiom/getApprobiomTables'
import { useState, useCallback, useEffect, useRef } from 'react'

const REQUIRED_ACCESS_FULL_LEVEL = 'full'

type GristState<D> =
    | { status: 'connecting'; data: null; error: null; accessLevel: null }
    | { status: 'grist undefined'; data: null; error: null; accessLevel: null }
    | {
          status: 'denied' | 'loading'
          data: null
          error: null
          accessLevel: string
      }
    | { status: 'error'; data: null; error: Error; accessLevel: string | null }
    | { status: 'ready'; data: D; error: null; accessLevel: string }

export type UseGristResult<D> = GristState<D> & { refetch: () => void }

export function useGrist<const S extends TableSpec>(
    spec: S
): UseGristResult<FetchedData<S>> {
    type Data = FetchedData<S>

    const [accessLevel, setAccessLevel] = useState<string | null>(null)

    const [state, setState] = useState<GristState<Data>>({
        status: 'connecting',
        data: null,
        error: null,
        accessLevel: null,
    })

    const [attempt, setAttempt] = useState(0)

    const refetch = useCallback(() => {
        setAttempt((n) => n + 1)
    }, [])

    // The fetch effect reads the spec through this ref rather than from its
    // dependency array: an inline spec is a new object every render and would
    // otherwise retrigger the effect endlessly. `specKey` — the spec's content,
    // not its identity — is what actually decides when to refetch.
    const specRef = useRef(spec)
    specRef.current = spec
    const specKey = JSON.stringify(spec)

    // Connection to Grist
    useEffect(() => {
        grist.onOptions((_options, settings) => {
            setAccessLevel(settings.accessLevel)
        })

        grist.ready({
            requiredAccess: REQUIRED_ACCESS_FULL_LEVEL,
        })

        setState({
            status: 'grist undefined',
            data: null,
            error: null,
            accessLevel: null,
        })
    }, [])

    useEffect(() => {
        let cancelled = false

        async function load() {
            if (accessLevel === null) {
                return
            }

            if (accessLevel !== REQUIRED_ACCESS_FULL_LEVEL) {
                setState({
                    status: 'denied',
                    data: null,
                    error: null,
                    accessLevel,
                })
                return
            }

            setState({
                status: 'loading',
                data: null,
                error: null,
                accessLevel,
            })

            const data = await getApprobiomTables(specRef.current)

            if (cancelled) return

            setState({
                status: 'ready',
                data,
                error: null,
                accessLevel,
            })
        }

        void load().catch((cause: unknown) => {
            if (cancelled) return

            setState({
                status: 'error',
                data: null,
                accessLevel,
                error:
                    cause instanceof Error ? cause : new Error(String(cause)),
            })
        })

        return () => {
            cancelled = true
        }
    }, [accessLevel, attempt, specKey])

    return {
        ...state,
        refetch,
    }
}
