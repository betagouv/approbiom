import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import NewFournisseurPanel from './NewFournisseurPanel'
import type { SiretLookup } from '@shared/core/application/services/find-entreprise-by-siret'

const KNOWN = {
    siret: '00000000000003',
    denomination: 'SCIERIE FICTIVE DU VALLON',
}
const NEW_SIRET = '41234567800019'

function renderPanel({
    initialSiret = '',
    findEntrepriseBySiret = vi.fn((): Promise<SiretLookup> =>
        Promise.resolve({
            status: 'found',
            denomination: 'BOIS FICTIF DU PLATEAU',
        })
    ),
}: {
    initialSiret?: string
    findEntrepriseBySiret?: (siret: string) => Promise<SiretLookup>
} = {}) {
    const onCreate = vi.fn(() => Promise.resolve())
    const onSelectExisting = vi.fn()
    const onClose = vi.fn()

    render(
        <NewFournisseurPanel
            initialSiret={initialSiret}
            annuaireQuery="Scierie Fictive des Combes"
            entreprises={[KNOWN]}
            findEntrepriseBySiret={findEntrepriseBySiret}
            onCreate={onCreate}
            onSelectExisting={onSelectExisting}
            onClose={onClose}
        />
    )

    return { onCreate, onSelectExisting, onClose, findEntrepriseBySiret }
}

const siretInput = () => screen.getByLabelText<HTMLInputElement>(/^SIRET/)
const denominationInput = () =>
    screen.getByLabelText<HTMLInputElement>(/^Dénomination/)
const typeSiret = (text: string) =>
    fireEvent.change(siretInput(), { target: { value: text } })
const addButton = () =>
    screen.getByRole('button', { name: 'Ajouter le fournisseur' })

afterEach(cleanup)

describe('NewFournisseurPanel', () => {
    it('starts in the SIRET field, prefilled with the digits typed', () => {
        renderPanel({ initialSiret: '412345' })

        expect(siretInput().value).toBe('412345')
        expect(document.activeElement).toBe(siretInput())
        expect(screen.getByText('6 / 14 chiffres')).toBeDefined()
    })

    it('refuses anything but digits at once', () => {
        renderPanel()

        typeSiret('412a')

        expect(
            screen.getByText('Le SIRET ne doit contenir que des chiffres.')
        ).toBeDefined()
        expect(siretInput().getAttribute('aria-invalid')).toBe('true')
    })

    it('waits for the field to be left before counting the digits', () => {
        renderPanel()

        typeSiret('412')
        expect(screen.queryByText(/doit contenir 14 chiffres/)).toBeNull()

        fireEvent.blur(siretInput())
        expect(
            screen.getByText('Le SIRET doit contenir 14 chiffres (3 saisis).')
        ).toBeDefined()
    })

    it('points at the fournisseur that already has the SIRET', () => {
        const { onSelectExisting, findEntrepriseBySiret } = renderPanel()

        typeSiret(KNOWN.siret)
        fireEvent.click(
            screen.getByRole('button', {
                name: `Sélectionner « ${KNOWN.denomination} »`,
            })
        )

        expect(
            screen.getByText(
                `Ce SIRET est déjà utilisé par le fournisseur « ${KNOWN.denomination} ».`
            )
        ).toBeDefined()
        expect(onSelectExisting).toHaveBeenCalledWith(KNOWN)
        expect(findEntrepriseBySiret).not.toHaveBeenCalled()
    })

    it('looks the denomination up once the SIRET is valid', async () => {
        const { findEntrepriseBySiret } = renderPanel()

        typeSiret('412 345 678 00019')

        expect(
            screen.getByText('Recherche de la dénomination en cours…')
        ).toBeDefined()
        expect(await screen.findByText('Établissement trouvé.')).toBeDefined()
        expect(denominationInput().value).toBe('BOIS FICTIF DU PLATEAU')
        expect(denominationInput().readOnly).toBe(true)
        expect(findEntrepriseBySiret).toHaveBeenCalledWith(NEW_SIRET)
    })

    it('says when no establishment carries the SIRET', async () => {
        renderPanel({
            findEntrepriseBySiret: () =>
                Promise.resolve({ status: 'notfound' }),
        })

        typeSiret(NEW_SIRET)

        expect(
            await screen.findByText(
                'Aucun établissement actif trouvé pour ce SIRET. Vérifiez le numéro.'
            )
        ).toBeDefined()
    })

    it('offers to try again when the service fails', async () => {
        const findEntrepriseBySiret = vi
            .fn<(siret: string) => Promise<SiretLookup>>()
            .mockRejectedValueOnce(new Error('503'))
            .mockResolvedValueOnce({
                status: 'found',
                denomination: 'BOIS FICTIF DU PLATEAU',
            })
        renderPanel({ findEntrepriseBySiret })

        typeSiret(NEW_SIRET)
        expect(
            await screen.findByText(
                'Le service de recherche est momentanément indisponible.'
            )
        ).toBeDefined()

        fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
        expect(await screen.findByText('Établissement trouvé.')).toBeDefined()
        expect(findEntrepriseBySiret).toHaveBeenCalledTimes(2)
    })

    it('ignores an answer for a SIRET changed since', async () => {
        let answerFirst: (lookup: SiretLookup) => void = () => {}
        const findEntrepriseBySiret = vi.fn(
            (siret: string): Promise<SiretLookup> =>
                siret === NEW_SIRET
                    ? new Promise((resolve) => (answerFirst = resolve))
                    : Promise.resolve({
                          status: 'found',
                          denomination: 'SECOND FICTIF',
                      })
        )
        renderPanel({ findEntrepriseBySiret })

        typeSiret(NEW_SIRET)
        typeSiret('41234567800027')
        expect(await screen.findByDisplayValue('SECOND FICTIF')).toBeDefined()

        await act(async () => {
            answerFirst({ status: 'found', denomination: 'PREMIER FICTIF' })
            await Promise.resolve()
        })
        expect(denominationInput().value).toBe('SECOND FICTIF')
    })

    it('adds the fournisseur found', async () => {
        const { onCreate } = renderPanel()

        typeSiret(NEW_SIRET)
        await screen.findByText('Établissement trouvé.')
        fireEvent.click(addButton())

        expect(onCreate).toHaveBeenCalledWith({
            siret: NEW_SIRET,
            denomination: 'BOIS FICTIF DU PLATEAU',
        })
    })

    it('adds with Enter in the SIRET field', async () => {
        const { onCreate } = renderPanel()

        typeSiret(NEW_SIRET)
        await screen.findByText('Établissement trouvé.')
        fireEvent.keyDown(siretInput(), { key: 'Enter' })

        expect(onCreate).toHaveBeenCalled()
    })

    it('does not add before the denomination is found', () => {
        const { onCreate } = renderPanel({
            findEntrepriseBySiret: () => new Promise(() => {}),
        })

        typeSiret(NEW_SIRET)
        fireEvent.click(addButton())

        expect(onCreate).not.toHaveBeenCalled()
        expect(
            screen.getByText(
                'La dénomination doit être trouvée pour ajouter le fournisseur.'
            )
        ).toBeDefined()
    })

    it('asks for a SIRET when adding with an empty field', () => {
        const { onCreate } = renderPanel()

        fireEvent.click(addButton())

        expect(onCreate).not.toHaveBeenCalled()
        expect(
            screen.getByText('Renseignez le SIRET du fournisseur.')
        ).toBeDefined()
        expect(document.activeElement).toBe(siretInput())
    })

    it('closes with Annuler or Escape, which goes no further', () => {
        const outside = vi.fn()
        document.addEventListener('keydown', outside)
        const { onClose } = renderPanel()

        fireEvent.keyDown(siretInput(), { key: 'Escape' })
        fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))

        expect(onClose).toHaveBeenCalledTimes(2)
        expect(outside).not.toHaveBeenCalled()
        document.removeEventListener('keydown', outside)
    })
})
