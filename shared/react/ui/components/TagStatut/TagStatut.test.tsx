import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import TagStatut from './TagStatut'

afterEach(() => {
    cleanup()
})

describe('TagStatut', () => {
    it('colours each known statut', () => {
        render(<TagStatut statut="projet" />)

        expect(screen.getByText('projet').className).toContain(
            'fr-tag--purple-glycine'
        )
    })

    it('leaves an unknown statut grey', () => {
        render(<TagStatut statut="à l'étude" />)

        expect(screen.getByText("à l'étude").className).not.toMatch(
            /fr-tag--[a-z]+-/
        )
    })
})
