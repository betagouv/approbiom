import { getApprobiomTables } from '@shared/grist/approbiom/getApprobiomTables'
import type { ApprobiomTables } from '@shared/grist/approbiom/model'
import { useState, useCallback, useEffect } from 'react'

const REQUIRED_ACCESS_FULL_LEVEL = 'full'

type GristState =
    | { status: 'connecting'; data: null; error: null; accessLevel: null }
    | { status: 'grist undefined'; data: null; error: null; accessLevel: null }
    | {
          status: 'denied' | 'loading'
          data: null
          error: null
          accessLevel: string
      }
    | { status: 'error'; data: null; error: Error; accessLevel: string | null }
    | {
          status: 'ready'
          data: ApprobiomTables
          error: null
          accessLevel: string
      }

export type UseGristResult = GristState & { refetch: () => void }

export function useGrist(): UseGristResult {
    const [accessLevel, setAccessLevel] = useState<string | null>(null)

    const [state, setState] = useState<GristState>({
        status: 'connecting',
        data: null,
        error: null,
        accessLevel: null,
    })

    const [attempt, setAttempt] = useState(0)

    const refetch = useCallback(() => {
        setAttempt((n) => n + 1)
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

            const data = await getApprobiomTables()

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
    }, [accessLevel, attempt])

    return {
        ...state,
        refetch,
    }
}
