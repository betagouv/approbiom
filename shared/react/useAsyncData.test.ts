import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useAsyncData } from './useAsyncData'

describe('useAsyncData', () => {
    it('reads again on a refresh', async () => {
        const load = vi
            .fn()
            .mockResolvedValueOnce('En attente')
            .mockResolvedValueOnce('Avis favorable')

        const { result } = renderHook(() => useAsyncData(load))

        await waitFor(() => expect(result.current.data).toBe('En attente'))

        act(() => result.current.refresh())

        await waitFor(() => expect(result.current.data).toBe('Avis favorable'))
        expect(load).toHaveBeenCalledTimes(2)
    })

    it('leaves the data on screen while a refresh is in flight', async () => {
        // A write is confirmed by the screen showing what was stored, so it
        // must not empty and load back in between.
        let arrive: (value: string) => void = () => {}
        const load = vi
            .fn()
            .mockResolvedValueOnce('En attente')
            .mockReturnValueOnce(
                new Promise<string>((resolve) => {
                    arrive = resolve
                })
            )

        const { result } = renderHook(() => useAsyncData(load))
        await waitFor(() => expect(result.current.status).toBe('ready'))

        act(() => result.current.refresh())

        expect(result.current.status).toBe('ready')
        expect(result.current.data).toBe('En attente')

        await act(() => {
            arrive('Avis favorable')
            return Promise.resolve()
        })
        expect(result.current.data).toBe('Avis favorable')
    })

    it('starts over from nothing on a retry', async () => {
        // A retry follows a failure, so there is nothing worth keeping.
        const load = vi.fn().mockResolvedValue('En attente')

        const { result } = renderHook(() => useAsyncData(load))
        await waitFor(() => expect(result.current.status).toBe('ready'))

        act(() => result.current.retry())

        expect(result.current.status).toBe('loading')
        expect(result.current.data).toBeNull()
    })
})
