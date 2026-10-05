import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import AttachmentPicker from './AttachmentPicker'
import type { ExtractionSummary } from '../../extracted-approvisionnement-port'

const ATTACHMENT = {
    id: 20,
    planDApprovisionnement: 160,
    type: 'excel ademe',
    name: 'plan.xlsx',
    sizeInBytes: 2048,
}

function renderCard(summary?: ExtractionSummary) {
    render(
        <AttachmentPicker
            attachments={[ATTACHMENT]}
            extractions={new Map(summary ? [[ATTACHMENT.id, summary]] : [])}
            selectedId={null}
            onSelect={vi.fn()}
        />
    )

    return screen.getByRole('button', { name: /plan\.xlsx/ })
}

afterEach(cleanup)

describe('AttachmentPicker', () => {
    it('shows no extraction badge for a document never extracted', () => {
        const card = renderCard({
            attachmentId: ATTACHMENT.id,
            extractedAt: null,
            lineCount: 0,
            createdCount: 0,
        })

        expect(card.querySelector('.fr-badge')).toBeNull()
        expect(card.textContent).not.toMatch(/extrait|Déjà présentes/i)
    })

    it('shows no extraction badge when nothing is known of the document', () => {
        expect(renderCard().querySelector('.fr-badge')).toBeNull()
    })

    it('shows when an extracted document was extracted', () => {
        const card = renderCard({
            attachmentId: ATTACHMENT.id,
            extractedAt: new Date(2026, 8, 27, 15, 36),
            lineCount: 4,
            createdCount: 1,
        })

        expect(card.querySelector('.fr-badge')?.textContent).toBe(
            'Extrait le 27/09/2026 à 15h36'
        )
        expect(card.textContent).toContain('Déjà présentes : 1 ligne sur 4')
    })
})
