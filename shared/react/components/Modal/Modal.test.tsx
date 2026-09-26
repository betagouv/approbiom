import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Modal from './Modal'
import type { ModalProps } from './Modal.types'

afterEach(() => {
    cleanup()
})

function renderModal(props: Partial<ModalProps> = {}) {
    return render(
        <Modal open title="Ligne Excel 17" onClose={() => {}} {...props}>
            <p>Contenu</p>
        </Modal>
    )
}

// A page with the button that opens the modal, to follow the focus.
function Page() {
    const [open, setOpen] = useState(false)

    return (
        <>
            <button type="button" onClick={() => setOpen(true)}>
                Ouvrir
            </button>
            <Modal open={open} title="Titre" onClose={() => setOpen(false)}>
                <p>Contenu</p>
            </Modal>
        </>
    )
}

describe('Modal', () => {
    it('shows nothing while closed', () => {
        renderModal({ open: false })

        expect(screen.queryByText('Contenu')).toBeNull()
    })

    it('is a modal dialog named after its title', () => {
        renderModal()

        const dialog = screen.getByRole('dialog', { name: 'Ligne Excel 17' })
        expect(dialog.getAttribute('aria-modal')).toBe('true')
        expect(screen.getByText('Contenu')).toBeDefined()
    })

    it('renders the title at the level it is given', () => {
        renderModal({ titleAs: 'h3' })

        expect(
            screen.getByRole('heading', { level: 3, name: 'Ligne Excel 17' })
        ).toBeDefined()
    })

    it('closes with the « Fermer » button', () => {
        const onClose = vi.fn()
        renderModal({ onClose })

        fireEvent.click(screen.getByRole('button', { name: 'Fermer' }))

        expect(onClose).toHaveBeenCalledOnce()
    })

    it('closes with Escape', () => {
        const onClose = vi.fn()
        renderModal({ onClose })

        // Escape reaches a modal <dialog> as a `cancel` event.
        fireEvent(
            screen.getByRole('dialog'),
            new Event('cancel', { cancelable: true })
        )

        expect(onClose).toHaveBeenCalledOnce()
    })

    it('closes on a click on the overlay, not on its content', () => {
        const onClose = vi.fn()
        renderModal({ onClose })

        fireEvent.click(screen.getByText('Contenu'))
        expect(onClose).not.toHaveBeenCalled()

        fireEvent.click(screen.getByRole('dialog'))
        expect(onClose).toHaveBeenCalledOnce()
    })

    it('shows the action zone only when given actions', () => {
        const { container, rerender } = renderModal()
        expect(container.querySelector('.fr-modal__footer')).toBeNull()

        rerender(
            <Modal
                open
                title="Titre"
                onClose={() => {}}
                actions={<button type="button">Valider</button>}
            >
                <p>Contenu</p>
            </Modal>
        )

        expect(
            container
                .querySelector('.fr-modal__footer')
                ?.contains(screen.getByRole('button', { name: 'Valider' }))
        ).toBe(true)
    })

    it('freezes the page while open', () => {
        const { rerender } = renderModal()
        const root = document.documentElement
        expect(root.getAttribute('data-fr-scrolling')).toBe('false')

        rerender(
            <Modal open={false} title="Titre" onClose={() => {}}>
                <p>Contenu</p>
            </Modal>
        )

        expect(root.hasAttribute('data-fr-scrolling')).toBe(false)
    })

    it('gives the focus back to the button that opened it', () => {
        render(<Page />)
        const opener = screen.getByRole('button', { name: 'Ouvrir' })

        opener.focus()
        fireEvent.click(opener)
        fireEvent.click(screen.getByRole('button', { name: 'Fermer' }))

        expect(document.activeElement).toBe(opener)
    })

    it('puts the focus on its first focusable element when it opens', () => {
        render(<Page />)

        fireEvent.click(screen.getByRole('button', { name: 'Ouvrir' }))

        expect(document.activeElement).toBe(
            screen.getByRole('button', { name: 'Fermer' })
        )
    })
})
