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

const badgesOf = (card: HTMLElement) =>
    [...card.querySelectorAll('.fr-badge')].map((badge) => badge.textContent)

describe('AttachmentPicker', () => {
    it('says when nothing is known of the document', () => {
        expect(badgesOf(renderCard())).toEqual([
            "Aucune extraction n'a encore été effectuée",
        ])
    })

    it('shows no extraction date for a document never extracted', () => {
        const card = renderCard({
            attachmentId: ATTACHMENT.id,
            extractedAt: null,
            lineCount: 0,
            createdCount: 0,
        })

        expect(badgesOf(card)).toEqual([
            'Lignes importées dans Approbiom : 0/0',
        ])
    })

    it('shows when an extracted document was extracted and its imported lines', () => {
        const card = renderCard({
            attachmentId: ATTACHMENT.id,
            extractedAt: new Date(2026, 8, 27, 15, 36),
            lineCount: 4,
            createdCount: 1,
        })

        expect(badgesOf(card)).toEqual([
            'Extraction faite le 27/09/2026 à 15h36',
            'Lignes importées dans Approbiom : 1/4',
        ])
    })
})
