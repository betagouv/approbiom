import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import RessourceFilter from './RessourceFilter'

const ressourcesOf = (count: number) =>
    Array.from({ length: count }, (_, index) => ({
        code: `R${index + 1}`,
        title: `Ressource ${index + 1}`,
    }))

function renderFilter(count: number) {
    function Controlled() {
        const [chosen, setChosen] = useState<string[]>([])

        return (
            <RessourceFilter
                ressources={ressourcesOf(count)}
                chosen={chosen}
                onChange={setChosen}
            />
        )
    }

    render(<Controlled />)
}

const toggles = () =>
    screen
        .queryAllByRole('button')
        .filter((button) => button.hasAttribute('aria-pressed'))

afterEach(cleanup)

describe('RessourceFilter', () => {
    it('offers one selectable tag per ressource, up to six', () => {
        renderFilter(6)

        expect(toggles()).toHaveLength(6)
        expect(
            screen.getByRole('group', { name: 'Filtrer par ressource :' })
        ).toBeTruthy()
    })

    it('offers a list past six, as DSFR asks', () => {
        renderFilter(7)

        expect(toggles()).toHaveLength(0)
        expect(
            screen.getByRole('button', { name: /Filtrer par ressource/ })
        ).toBeTruthy()
    })

    it('recalls each ressource chosen in the list with a removable tag', () => {
        renderFilter(7)

        fireEvent.click(
            screen.getByRole('button', { name: /Filtrer par ressource/ })
        )
        fireEvent.click(
            screen.getByRole('checkbox', { name: 'R3 · Ressource 3' })
        )

        fireEvent.click(
            screen.getByRole('button', { name: 'Retirer le filtre R3' })
        )

        expect(
            screen.queryByRole('button', { name: 'Retirer le filtre R3' })
        ).toBeNull()
        expect(
            screen.getByRole<HTMLInputElement>('checkbox', {
                name: 'R3 · Ressource 3',
            }).checked
        ).toBe(false)
    })

    it('clears every ressource chosen at once', () => {
        renderFilter(3)

        fireEvent.click(screen.getByRole('button', { name: 'R1' }))
        fireEvent.click(screen.getByRole('button', { name: 'R2' }))
        fireEvent.click(
            screen.getByRole('button', { name: 'Toutes les ressources' })
        )

        expect(
            toggles().map((tag) => tag.getAttribute('aria-pressed'))
        ).toEqual(['false', 'false', 'false'])
    })
})
