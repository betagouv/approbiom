import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import ImportModal from './ImportModal'

const renderModal = (approvisionnementCount: number) =>
    render(
        <ImportModal
            approvisionnementCount={approvisionnementCount}
            onConfirm={() => Promise.resolve()}
            onClose={() => {}}
        />
    )

afterEach(cleanup)

describe('ImportModal', () => {
    it('asks whether each approvisionnement was checked', () => {
        renderModal(3)

        expect(
            screen.getByRole('heading', {
                name: 'Avez-vous pensé à vérifier chaque approvisionnement ?',
            })
        ).toBeTruthy()
    })

    it('speaks of several approvisionnements in the plural', () => {
        renderModal(3)

        expect(
            screen.getByRole('button', {
                name: 'Importer ces 3 approvisionnements',
            })
        ).toBeTruthy()
        expect(
            screen.getByText(
                'En cliquant sur « Importer ces 3 approvisionnements », ils seront sauvegardés dans la base de données.'
            )
        ).toBeTruthy()
        expect(
            screen.getByText(
                "Vous pourrez toujours les modifier ou supprimer dans l'onglet Corrections."
            )
        ).toBeTruthy()
    })

    it('speaks of one approvisionnement in the singular', () => {
        renderModal(1)

        expect(
            screen.getByRole('button', {
                name: 'Importer cet approvisionnement',
            })
        ).toBeTruthy()
        expect(
            screen.getByText(
                'En cliquant sur « Importer cet approvisionnement », il sera sauvegardé dans la base de données.'
            )
        ).toBeTruthy()
        expect(
            screen.getByText(
                "Vous pourrez toujours le modifier ou supprimer dans l'onglet Corrections."
            )
        ).toBeTruthy()
    })
})
