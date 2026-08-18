import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import Badge from './Badge'
import type { BadgeStatus } from './Badge.types'

afterEach(() => {
    cleanup()
})

describe('Badge', () => {
    it('shows the state it is given', () => {
        render(<Badge>En instruction</Badge>)

        expect(screen.getByText('En instruction')).toBeDefined()
    })

    it('is a paragraph, not a control', () => {
        // DSFR's own markup, and the whole difference from a tag: a badge is
        // read, never clicked. A `<button>` here would promise something to
        // happen on click and put the badge in the tab order for nothing.
        expect(render(<Badge>Lauréat</Badge>).container.firstChild).toEqual(
            screen.getByText('Lauréat')
        )
        expect(screen.getByText('Lauréat').tagName).toBe('P')
    })

    it('renders the neutral grey badge when nothing narrows it', () => {
        render(<Badge>Brouillon</Badge>)

        // Grey is DSFR's default, painted by `fr-badge` alone. The assertion is
        // that no modifier is added behind the caller's back.
        expect(screen.getByText('Brouillon').className).toBe('fr-badge')
    })

    it.each<BadgeStatus>(['success', 'error', 'warning', 'info', 'new'])(
        'paints the %s status',
        (status) => {
            render(<Badge status={status}>Statut</Badge>)

            expect(screen.getByText('Statut').className).toContain(
                `fr-badge--${status}`
            )
        }
    )

    it('paints an illustrative colour by name', () => {
        render(<Badge color="green-emeraude">Bois</Badge>)

        expect(screen.getByText('Bois').className).toContain(
            'fr-badge--green-emeraude'
        )
    })

    it('renders at the medium size by default', () => {
        render(<Badge status="success">Accepté</Badge>)

        // DSFR has no `--md` class: medium is the plain `fr-badge`.
        expect(screen.getByText('Accepté').className).not.toContain(
            'fr-badge--sm'
        )
    })

    it('renders at the small size when asked', () => {
        render(
            <Badge status="success" size="sm">
                Accepté
            </Badge>
        )

        expect(screen.getByText('Accepté').className).toContain('fr-badge--sm')
    })

    it('keeps the status icon unless it is waved off', () => {
        render(<Badge status="error">Refusé</Badge>)

        // The icon comes from the status class itself, through a `::before`
        // jsdom does not paint. What is testable is that nothing removes it.
        expect(screen.getByText('Refusé').className).not.toContain(
            'fr-badge--no-icon'
        )
    })

    it('drops the status icon when asked', () => {
        render(
            <Badge status="error" noIcon>
                Refusé
            </Badge>
        )

        const badge = screen.getByText('Refusé')
        expect(badge.className).toContain('fr-badge--no-icon')
        // Dropping the icon drops the icon, not the colours that go with it.
        expect(badge.className).toContain('fr-badge--error')
    })
})
