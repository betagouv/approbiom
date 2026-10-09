import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { PAYS_ETRANGER } from '@shared/core/domain/value-objects/provenance'
import ProvenanceEditor from './ProvenanceEditor'

function renderEditor() {
    const onChange = vi.fn()
    render(
        <ProvenanceEditor
            distribution={[
                {
                    source: PAYS_ETRANGER,
                    provenance: 'Espagne',
                    percentage: 60,
                },
            ]}
            tonnage={22056}
            departementsByRegion={[]}
            pays={[{ libelle: 'Espagne' }]}
            onChange={onChange}
            onCreatePays={() => Promise.resolve()}
        />
    )

    return onChange
}

const tonnageField = () =>
    screen.getByRole<HTMLInputElement>('textbox', { name: 'Tonnage (t MV/an)' })

afterEach(cleanup)

describe('ProvenanceEditor', () => {
    it('writes a tonnage with a decimal comma', () => {
        renderEditor()

        expect(tonnageField().value).toBe('13233,6')
    })

    it('reads a tonnage typed with spaces and a comma', () => {
        const onChange = renderEditor()

        fireEvent.change(tonnageField(), { target: { value: '11 028' } })
        fireEvent.blur(tonnageField())

        expect(onChange).toHaveBeenCalledWith([
            { source: PAYS_ETRANGER, provenance: 'Espagne', percentage: 50 },
        ])
    })
})
