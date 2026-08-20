import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import TabNav from './TabNav'
import type { TabNavItem, TabNavProps } from './TabNav.types'

const sections: readonly TabNavItem[] = [
    { id: 'fil-instruction', label: 'Fil d’instruction' },
    { id: 'ressources', label: 'Ressources' },
    { id: 'documents', label: 'Documents' },
]

afterEach(() => {
    cleanup()
})

const getNav = () =>
    screen.getByRole('navigation', { name: 'Sections du plan' })

function renderTabNav(props: Partial<TabNavProps> = {}) {
    return render(
        <TabNav
            label="Sections du plan"
            items={sections}
            currentId="ressources"
            {...props}
        />
    )
}

describe('TabNav', () => {
    it('names the navigation landmark after its label', () => {
        renderTabNav()

        expect(getNav()).toBeDefined()
    })

    it('renders one entry per item, in order', () => {
        renderTabNav()

        expect(
            screen.getAllByRole('button').map((entry) => entry.textContent)
        ).toEqual(['Fil d’instruction', 'Ressources', 'Documents'])
    })

    it('marks the current item, and only that one', () => {
        renderTabNav()

        const current = screen
            .getAllByRole('button')
            .filter((entry) => entry.getAttribute('aria-current') === 'page')

        expect(current.map((entry) => entry.textContent)).toEqual([
            'Ressources',
        ])
    })

    it('marks nothing when no item matches the current id', () => {
        renderTabNav({ currentId: 'documents-archives' })

        expect(getNav().querySelector('[aria-current]')).toBeNull()
    })

    it('hands the id of the item that was picked back to the caller', () => {
        const onSelect = vi.fn()
        renderTabNav({ onSelect })

        fireEvent.click(screen.getByRole('button', { name: 'Documents' }))

        expect(onSelect).toHaveBeenCalledWith('documents')
    })

    // Clicking the page one is already on is a no-op as far as the navigation
    // is concerned, but it is the caller who decides that — closing a menu,
    // scrolling back to the top — so the click is reported like any other.
    it('reports a click on the current item too', () => {
        const onSelect = vi.fn()
        renderTabNav({ onSelect })

        fireEvent.click(screen.getByRole('button', { name: 'Ressources' }))

        expect(onSelect).toHaveBeenCalledWith('ressources')
    })

    // The two forms an item takes, and what tells them apart: somewhere to go.
    it('renders an item with an href as a link, and the others as buttons', () => {
        renderTabNav({
            items: [
                { id: 'documents', label: 'Documents', href: '#documents' },
                ...sections.slice(0, 1),
            ],
        })

        expect(
            screen.getByRole('link', { name: 'Documents' }).getAttribute('href')
        ).toBe('#documents')
        expect(screen.getAllByRole('button')).toHaveLength(1)
    })

    it('leaves a linked item to the browser rather than to onSelect', () => {
        const onSelect = vi.fn()
        renderTabNav({
            items: [
                { id: 'documents', label: 'Documents', href: '#documents' },
            ],
            onSelect,
        })

        fireEvent.click(screen.getByRole('link', { name: 'Documents' }))

        expect(onSelect).not.toHaveBeenCalled()
    })
})
