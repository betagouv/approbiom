import { afterEach, describe, expect, it, vi } from 'vitest'
import { StrictMode } from 'react'
import { cleanup, render, waitFor } from '@testing-library/react'
import Extraction from './Extraction'

afterEach(cleanup)

describe('Extraction', () => {
    it('extracts once, even when React runs the effect twice', async () => {
        const extract = vi.fn(() => Promise.resolve('lignes'))
        const onExtracted = vi.fn()

        render(
            <StrictMode>
                <Extraction
                    extract={extract}
                    onExtracted={onExtracted}
                    onChooseAnother={() => {}}
                />
            </StrictMode>
        )

        await waitFor(() => expect(onExtracted).toHaveBeenCalledWith('lignes'))
        expect(extract).toHaveBeenCalledOnce()
    })
})
