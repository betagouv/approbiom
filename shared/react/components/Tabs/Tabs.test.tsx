import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import Tabs from './Tabs'
import type { TabItem, TabsProps } from './Tabs.types'

const ventilations: readonly TabItem[] = [
    {
        id: 'provenance',
        label: 'Par provenance',
        content: <p>Tableau des provenances</p>,
    },
    {
        id: 'region-ou-pays',
        label: 'Par région ou pays',
        content: <p>Tableau des régions</p>,
    },
    {
        id: 'fournisseur',
        label: 'Par fournisseur',
        content: <p>Tableau des fournisseurs</p>,
    },
]

afterEach(() => {
    cleanup()
})

function renderTabs(props: Partial<TabsProps> = {}) {
    return render(<Tabs label="Ventilation" items={ventilations} {...props} />)
}

const openTab = () =>
    screen
        .getAllByRole('tab')
        .find((tab) => tab.getAttribute('aria-selected') === 'true')

describe('Tabs', () => {
    it('names the tablist after its label', () => {
        renderTabs()

        expect(
            screen.getByRole('tablist', { name: 'Ventilation' })
        ).toBeDefined()
    })

    it('renders one tab per item, in order', () => {
        renderTabs()

        expect(
            screen.getAllByRole('tab').map((tab) => tab.textContent)
        ).toEqual(['Par provenance', 'Par région ou pays', 'Par fournisseur'])
    })

    it('opens the first tab when no other one is named', () => {
        renderTabs()

        expect(openTab()?.textContent).toBe('Par provenance')
    })

    it('opens the tab named by defaultId', () => {
        renderTabs({ defaultId: 'fournisseur' })

        expect(openTab()?.textContent).toBe('Par fournisseur')
    })

    // The whole point of the component: one panel is read at a time, and it is
    // the one belonging to the open tab.
    it('shows the panel of the open tab, and only that one', () => {
        renderTabs({ defaultId: 'region-ou-pays' })

        expect(
            screen.getAllByRole('tabpanel').map((panel) => panel.textContent)
        ).toEqual(['Tableau des régions'])
    })

    it('opens the panel of the tab that was clicked', () => {
        renderTabs()

        fireEvent.click(screen.getByRole('tab', { name: 'Par fournisseur' }))

        expect(openTab()?.textContent).toBe('Par fournisseur')
        expect(screen.getByRole('tabpanel').textContent).toBe(
            'Tableau des fournisseurs'
        )
    })

    // Closed rather than unmounted: `aria-controls` still resolves, and
    // whatever state the content holds — how a table was sorted — is still
    // there when the reader comes back to it.
    it('leaves the closed panels in the document', () => {
        const { container } = renderTabs()

        expect(container.querySelectorAll('[role="tabpanel"]')).toHaveLength(3)
    })

    it('ties every tab to its own panel, both ways round', () => {
        renderTabs()

        for (const tab of screen.getAllByRole('tab')) {
            // `getElementById` rather than a query on the container: the panel
            // of a closed tab is hidden, so nothing that reads the
            // accessibility tree will hand it back.
            const panel = document.getElementById(
                tab.getAttribute('aria-controls') ?? ''
            )

            expect(panel?.getAttribute('aria-labelledby')).toBe(tab.id)
        }
    })

    // A roving tabindex: one Tab press reaches the tablist and the next leaves
    // it, rather than stopping on every tab on the way to the panel.
    it('keeps only the open tab in the tab order', () => {
        renderTabs({ defaultId: 'region-ou-pays' })

        expect(
            screen
                .getAllByRole('tab')
                .map((tab) => tab.getAttribute('tabindex'))
        ).toEqual(['-1', '0', '-1'])
    })

    it('opens the next tab on the right arrow, and focuses it', () => {
        renderTabs()

        const tab = screen.getByRole('tab', { name: 'Par provenance' })
        tab.focus()
        fireEvent.keyDown(tab, { key: 'ArrowRight' })

        const next = screen.getByRole('tab', { name: 'Par région ou pays' })
        expect(openTab()).toBe(next)
        expect(document.activeElement).toBe(next)
    })

    it('wraps around at both ends of the list', () => {
        renderTabs()

        const first = screen.getByRole('tab', { name: 'Par provenance' })
        first.focus()
        fireEvent.keyDown(first, { key: 'ArrowLeft' })

        expect(openTab()?.textContent).toBe('Par fournisseur')

        fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' })

        expect(openTab()?.textContent).toBe('Par provenance')
    })

    it('jumps to the ends of the list on Home and End', () => {
        renderTabs({ defaultId: 'region-ou-pays' })

        const tab = screen.getByRole('tab', { name: 'Par région ou pays' })
        tab.focus()
        fireEvent.keyDown(tab, { key: 'End' })

        expect(openTab()?.textContent).toBe('Par fournisseur')

        fireEvent.keyDown(document.activeElement!, { key: 'Home' })

        expect(openTab()?.textContent).toBe('Par provenance')
    })

    // The arrows are the tablist's, but every other key belongs to the page —
    // and to the reader, who may be scrolling it.
    it('leaves keys it does not handle alone', () => {
        renderTabs()

        const tab = screen.getByRole('tab', { name: 'Par provenance' })
        const handled = fireEvent.keyDown(tab, { key: 'PageDown' })

        expect(handled).toBe(true)
        expect(openTab()?.textContent).toBe('Par provenance')
    })
})
