import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import NewPaysForm from './NewPaysForm'

function renderForm() {
    const onCreate = vi.fn(() => Promise.resolve())
    const onSelectExisting = vi.fn()

    render(
        <NewPaysForm
            pays={[{ libelle: 'Italie' }]}
            onCreate={onCreate}
            onSelectExisting={onSelectExisting}
            onCancel={vi.fn()}
        />
    )

    return { onCreate, onSelectExisting }
}

function submit(libelle: string) {
    fireEvent.change(screen.getByLabelText('Nouveau pays'), {
        target: { value: libelle },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Créer le pays' }))
}

afterEach(cleanup)

describe('NewPaysForm', () => {
    it('creates the country', () => {
        const { onCreate } = renderForm()

        submit(' Portugal ')

        expect(onCreate).toHaveBeenCalledWith({ libelle: 'Portugal' })
    })

    it('offers the country already there, whatever its case', () => {
        const { onCreate, onSelectExisting } = renderForm()

        submit('italie')
        fireEvent.click(screen.getByRole('button', { name: 'Choisir ce pays' }))

        expect(onCreate).not.toHaveBeenCalled()
        expect(onSelectExisting).toHaveBeenCalledWith({ libelle: 'Italie' })
    })

    it('refuses France, chosen by département', () => {
        const { onCreate } = renderForm()

        submit('France')

        expect(onCreate).not.toHaveBeenCalled()
    })
})
