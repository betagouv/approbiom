import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DismissibleTag from './DismissibleTag'

afterEach(cleanup)

describe('DismissibleTag', () => {
    it('is named by what the click does', () => {
        render(
            <DismissibleTag
                dismissLabel="Retirer le filtre 1A-PFA"
                onDismiss={vi.fn()}
            >
                1A-PFA
            </DismissibleTag>
        )

        expect(
            screen.getByRole('button', { name: 'Retirer le filtre 1A-PFA' })
                .textContent
        ).toBe('1A-PFA')
    })

    it('asks to be dismissed when clicked', () => {
        const onDismiss = vi.fn()
        render(
            <DismissibleTag
                dismissLabel="Retirer le filtre 1A-PFA"
                onDismiss={onDismiss}
            >
                1A-PFA
            </DismissibleTag>
        )

        fireEvent.click(screen.getByRole('button'))

        expect(onDismiss).toHaveBeenCalledOnce()
    })

    it('takes the small size', () => {
        render(
            <DismissibleTag
                dismissLabel="Retirer le filtre 1A-PFA"
                onDismiss={vi.fn()}
                size="sm"
            >
                1A-PFA
            </DismissibleTag>
        )

        expect(screen.getByRole('button').className).toBe(
            'fr-tag fr-tag--sm fr-tag--dismiss'
        )
    })
})
