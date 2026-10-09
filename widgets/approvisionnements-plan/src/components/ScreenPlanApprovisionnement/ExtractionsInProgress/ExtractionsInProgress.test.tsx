import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import ExtractionsInProgress from './ExtractionsInProgress'

const extraction = (id: number, name: string) => ({
    attachment: {
        id,
        planDApprovisionnement: 1,
        type: 'excel ademe',
        name,
        sizeInBytes: 2048,
    },
    summary: {
        attachmentId: id,
        extractedAt: new Date(2026, 9, 9, 10, 48),
        lineCount: 3,
        verifiedCount: 1,
    },
})

afterEach(cleanup)

describe('ExtractionsInProgress', () => {
    it('shows nothing without extraction in progress', () => {
        const { container } = render(
            <ExtractionsInProgress extractions={[]} onResume={vi.fn()} />
        )

        expect(container.innerHTML).toBe('')
    })

    it('counts the extractions in progress', () => {
        render(
            <ExtractionsInProgress
                extractions={[
                    extraction(20, 'a.xlsx'),
                    extraction(21, 'b.xlsx'),
                ]}
                onResume={vi.fn()}
            />
        )

        expect(screen.getByText('2 extractions en cours')).toBeTruthy()
        expect(screen.getAllByRole('listitem')).toHaveLength(2)
    })

    it('resumes the verification of a document', () => {
        const onResume = vi.fn()
        render(
            <ExtractionsInProgress
                extractions={[extraction(20, 'a.xlsx')]}
                onResume={onResume}
            />
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Reprendre la vérification de a.xlsx',
            })
        )

        expect(onResume).toHaveBeenCalledWith(20)
    })
})
