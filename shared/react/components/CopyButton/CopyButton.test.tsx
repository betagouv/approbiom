import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CopyButton from './CopyButton'

function mockClipboard(writeText: (text: string) => Promise<void>) {
    const spy = vi.fn(writeText)
    Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: spy },
        configurable: true,
    })
    return spy
}

afterEach(() => {
    cleanup()
    vi.useRealTimers()
})

describe('CopyButton', () => {
    it('names what it copies', () => {
        render(<CopyButton value="00000000000001" label="le SIRET" />)

        expect(
            screen.getByRole('button', { name: 'Copier le SIRET' })
        ).toBeDefined()
    })

    it('puts the value in the clipboard', async () => {
        const writeText = mockClipboard(() => Promise.resolve())
        render(<CopyButton value="00000000000001" label="le SIRET" />)

        fireEvent.click(screen.getByRole('button'))
        await act(() => Promise.resolve())

        expect(writeText).toHaveBeenCalledWith('00000000000001')
        expect(screen.getByRole('button').textContent).toBe('Copié le SIRET')
        expect(screen.getByRole('status').textContent).toBe(
            'le SIRET copié dans le presse-papiers'
        )
    })

    it('says when the copy failed', async () => {
        mockClipboard(() => Promise.reject(new Error('refusé')))
        render(<CopyButton value="00000000000001" />)

        fireEvent.click(screen.getByRole('button'))
        await act(() => Promise.resolve())

        expect(screen.getByRole('button').textContent).toBe('Copie impossible')
        expect(screen.getByRole('status').textContent).toBe('La copie a échoué')
    })

    it('reads « Copier » again after a moment', async () => {
        vi.useFakeTimers()
        mockClipboard(() => Promise.resolve())
        render(<CopyButton value="00000000000001" />)

        fireEvent.click(screen.getByRole('button'))
        await act(() => Promise.resolve())
        act(() => {
            vi.advanceTimersByTime(2000)
        })

        expect(screen.getByRole('button').textContent).toBe('Copier')
    })
})
