import {
    getApprobiomTables,
    type FetchedData,
    type TableId,
    type TableSpec,
} from '@shared/grist/approbiom/getApprobiomTables'
import { fetchRows } from '@shared/grist/api/client'
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

export type UseGristResult<D> = GristState<D> & {
    refetch: () => void
    refetchTable: (tableId: TableId) => Promise<void>
}

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

    // Same reason as `specRef`: `refetchTable` is created once, so it reads the
    // state it has to patch through a ref rather than through a stale closure.
    const stateRef = useRef(state)
    stateRef.current = state

    /**
     * Re-reads one table and swaps it into the cached data, leaving the others
     * untouched. Unlike `refetch`, the status stays `ready` throughout, so the
     * tree is never unmounted and whatever the user had open stays open.
     *
     * Call it after writing to the document: the write may recompute formula
     * columns, so reading the row back is the only way to display what Grist
     * actually stored. Tables absent from the spec are ignored — they have no
     * entry to patch, and inventing one would break `FetchedData`.
     */
    const refetchTable = useCallback(async (tableId: TableId) => {
        const current = stateRef.current
        if (current.status !== 'ready' || !(tableId in current.data)) return

        const currentSpec: TableSpec = specRef.current
        const rows = await fetchRows(tableId, currentSpec[tableId])

        setState((prev) =>
            prev.status !== 'ready'
                ? prev
                : {
                      ...prev,
                      data: {
                          ...prev.data,
                          [tableId]: rows,
                      } as unknown as Data,
                  }
        )
    }, [])

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
        refetchTable,
    }
}
