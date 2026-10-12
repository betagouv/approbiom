import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import ImportModal from './ImportModal'

const renderModal = (lineCount: number) =>
    render(
        <ImportModal
            lineCount={lineCount}
            approvisionnementCount={lineCount}
            onConfirm={() => Promise.resolve()}
            onClose={() => {}}
        />
    )

afterEach(cleanup)

describe('ImportModal', () => {
    it('speaks of one line in the singular', () => {
        renderModal(1)

        expect(
            screen.getByRole('heading', {
                name: 'Importer la ligne vérifiée ?',
            })
        ).toBeTruthy()
    })

    it('speaks of several lines in the plural', () => {
        renderModal(2)

        expect(
            screen.getByRole('heading', {
                name: 'Importer les lignes vérifiées ?',
            })
        ).toBeTruthy()
    })
})
