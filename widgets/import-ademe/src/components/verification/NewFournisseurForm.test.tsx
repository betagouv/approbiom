import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import NewFournisseurForm from './NewFournisseurForm'

const EXISTING = {
    denomination: 'BOIS FICTIF ENERGIE',
    siret: '00000000000001',
}

function renderForm() {
    const onCreate = vi.fn(() => Promise.resolve())
    const onSelectExisting = vi.fn()

    render(
        <NewFournisseurForm
            defaultDenomination="Scierie Fictive des Combes"
            entreprises={[EXISTING]}
            onCreate={onCreate}
            onSelectExisting={onSelectExisting}
            onCancel={vi.fn()}
        />
    )

    return { onCreate, onSelectExisting }
}

function submit(siret: string) {
    fireEvent.change(screen.getByLabelText(/SIRET/), {
        target: { value: siret },
    })
    fireEvent.click(
        screen.getByRole('button', { name: 'Créer le fournisseur' })
    )
}

afterEach(cleanup)

describe('NewFournisseurForm', () => {
    it('starts from the name read in the document', () => {
        renderForm()

        expect(screen.getByLabelText('Dénomination')).toHaveProperty(
            'value',
            'Scierie Fictive des Combes'
        )
    })

    it('requires a 14 digit SIRET', () => {
        const { onCreate } = renderForm()

        submit('1234')

        expect(
            screen.getByText('Le SIRET doit comporter 14 chiffres.')
        ).toBeDefined()
        expect(onCreate).not.toHaveBeenCalled()
    })

    it('offers the entreprise that already has the SIRET', () => {
        const { onCreate, onSelectExisting } = renderForm()

        submit('00000000000001')
        fireEvent.click(
            screen.getByRole('button', { name: 'Choisir cette entreprise' })
        )

        expect(onCreate).not.toHaveBeenCalled()
        expect(onSelectExisting).toHaveBeenCalledWith(EXISTING)
    })

    it('creates the fournisseur, spaces left out of the SIRET', () => {
        const { onCreate } = renderForm()

        submit('000 000 000 00042')

        expect(onCreate).toHaveBeenCalledWith({
            denomination: 'Scierie Fictive des Combes',
            siret: '00000000000042',
        })
    })
})
