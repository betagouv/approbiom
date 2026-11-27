import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import TagTypeDePlan from './TagTypeDePlan'

afterEach(() => {
    cleanup()
})

describe('TagTypeDePlan', () => {
    it('colours each known type de plan', () => {
        render(<TagTypeDePlan typeDePlan="modification" />)

        expect(screen.getByText('modification').className).toContain(
            'fr-tag--pink-tuile'
        )
    })

    it('leaves an unknown type de plan grey', () => {
        render(<TagTypeDePlan typeDePlan="extension" />)

        expect(screen.getByText('extension').className).not.toMatch(
            /fr-tag--[a-z]+-/
        )
    })
})
