import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SelectableTag from './SelectableTag'

afterEach(cleanup)

describe('SelectableTag', () => {
    it('is a toggle button that says whether it is on', () => {
        render(
            <SelectableTag pressed onToggle={vi.fn()}>
                1A-PFA
            </SelectableTag>
        )

        expect(
            screen
                .getByRole('button', { name: '1A-PFA', pressed: true })
                .getAttribute('aria-pressed')
        ).toBe('true')
    })

    it('asks to be toggled when clicked', () => {
        const onToggle = vi.fn()
        render(
            <SelectableTag pressed={false} onToggle={onToggle}>
                1A-PFA
            </SelectableTag>
        )

        fireEvent.click(screen.getByRole('button', { name: '1A-PFA' }))

        expect(onToggle).toHaveBeenCalledOnce()
    })

    it('takes the small size', () => {
        render(
            <SelectableTag pressed={false} onToggle={vi.fn()} size="sm">
                1A-PFA
            </SelectableTag>
        )

        expect(screen.getByRole('button').className).toBe('fr-tag fr-tag--sm')
    })
})
