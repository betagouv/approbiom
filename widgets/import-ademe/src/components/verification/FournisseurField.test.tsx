import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import FournisseurField from './FournisseurField'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'

const VALLON = {
    siret: '00000000000003',
    denomination: 'SCIERIE FICTIVE DU VALLON',
}
const PLATEAU = {
    siret: '00000000000007',
    denomination: 'BOIS FICTIF DU PLATEAU',
}

function renderField(value: Entreprise['siret'] | null = null) {
    const onChange = vi.fn()
    const onCreate = vi.fn<(entreprise: Entreprise) => Promise<void>>(() =>
        Promise.resolve()
    )

    function Controlled() {
        const [entreprises, setEntreprises] = useState([
            { siret: VALLON.siret, denomination: '' },
            VALLON,
            PLATEAU,
        ])
        const [current, setCurrent] = useState(value)

        return (
            <FournisseurField
                entreprises={entreprises}
                value={current}
                onChange={(entreprise) => {
                    setCurrent(entreprise?.siret ?? null)
                    onChange(entreprise)
                }}
                onCreate={async (entreprise) => {
                    await onCreate(entreprise)
                    setEntreprises((previous) => [...previous, entreprise])
                }}
                documentSupplier="Scierie Fictive"
                findEntrepriseBySiret={() =>
                    Promise.resolve({
                        status: 'found',
                        denomination: 'GRANULES FICTIFS DE LA VALLEE',
                    })
                }
            />
        )
    }

    render(<Controlled />)

    return { onChange, onCreate }
}

const input = () =>
    screen.getByRole<HTMLInputElement>('combobox', { name: /Fournisseur/ })
const type = (text: string) =>
    fireEvent.change(input(), { target: { value: text } })
const optionTexts = () =>
    screen.getAllByRole('option').map((option) => option.textContent)

afterEach(cleanup)

describe('FournisseurField', () => {
    it('lists the fournisseurs by denomination, with their SIRET', () => {
        renderField()

        fireEvent.click(input())

        expect(optionTexts()).toEqual([
            'BOIS FICTIF DU PLATEAU — 00000000000007',
            'SCIERIE FICTIVE DU VALLON — 00000000000003',
            'Ajouter un nouveau fournisseur',
        ])
    })

    it('leaves out the entreprises without a name', () => {
        renderField()

        type(VALLON.siret)

        expect(optionTexts()).toEqual([
            'SCIERIE FICTIVE DU VALLON — 00000000000003',
        ])
    })

    it('finds a fournisseur by its SIRET', () => {
        renderField()

        type('00000000000003')

        expect(optionTexts()).toEqual([
            'SCIERIE FICTIVE DU VALLON — 00000000000003',
        ])
    })

    it('offers to add a fournisseur with the SIRET being typed', () => {
        renderField()

        type('412 345 678')

        expect(optionTexts()).toContain(
            'Ajouter le fournisseur avec le SIRET 412 345 678'
        )
    })

    it('reports the fournisseur chosen', () => {
        const { onChange } = renderField()

        type('vallon')
        fireEvent.keyDown(input(), { key: 'Enter' })

        expect(onChange).toHaveBeenLastCalledWith(VALLON)
    })

    it('says when the document named no known fournisseur', () => {
        renderField()

        expect(screen.getByText('Aucune correspondance trouvée')).toBeDefined()
    })

    it('opens the new fournisseur panel with the SIRET typed', () => {
        renderField()

        type('41234567800019')
        fireEvent.keyDown(input(), { key: 'ArrowUp' })
        fireEvent.keyDown(input(), { key: 'Enter' })

        expect(screen.getByLabelText<HTMLInputElement>(/^SIRET/).value).toBe(
            '41234567800019'
        )
    })

    it('adds the fournisseur, chooses it and says so', async () => {
        const { onCreate, onChange } = renderField()

        type('41234567800019')
        fireEvent.keyDown(input(), { key: 'Enter' })
        await screen.findByText('Établissement trouvé.')
        fireEvent.click(
            screen.getByRole('button', { name: 'Ajouter le fournisseur' })
        )

        const added = {
            siret: '41234567800019',
            denomination: 'GRANULES FICTIFS DE LA VALLEE',
        }
        expect(
            await screen.findByText(
                'Fournisseur « GRANULES FICTIFS DE LA VALLEE » ajouté et sélectionné.'
            )
        ).toBeDefined()
        expect(onCreate).toHaveBeenCalledWith(added)
        expect(onChange).toHaveBeenLastCalledWith(added)
        expect(input().value).toBe(
            'GRANULES FICTIFS DE LA VALLEE — 41234567800019'
        )
        expect(screen.queryByLabelText(/^SIRET/)).toBeNull()
    })
})
