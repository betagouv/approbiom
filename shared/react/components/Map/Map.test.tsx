import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, it } from 'vitest'
import Map from './Map'

afterEach(() => {
    cleanup()
})

describe('Map', () => {
    it('renders its placeholder', () => {
        render(<Map />)
    })
})
