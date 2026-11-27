import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SearchBar from './SearchBar'

const options: readonly string[] = [
    'Chaufferie',
    'RC St Junien',
    'BIO2 St Gaudens',
]

afterEach(() => {
    cleanup()
})

const getInput = () =>
    screen.queryByRole<HTMLInputElement>('combobox', {
        name: 'Rechercher un plan',
    }) ??
    screen.getByRole<HTMLInputElement>('searchbox', {
        name: 'Rechercher un plan',
    })

const getButton = () => screen.getByRole('button', { name: 'Rechercher' })

const type = (text: string) =>
    fireEvent.change(getInput(), { target: { value: text } })

describe('SearchBar', () => {
    it('keeps the suggestion panel closed until the field is clicked', () => {
        render(<SearchBar label="Rechercher un plan" suggestions={options} />)

        expect(screen.queryByRole('listbox')).toBeNull()
        expect(getInput().getAttribute('aria-expanded')).toBe('false')
    })

    it('opens the suggestion panel with its options when the field is clicked', () => {
        render(<SearchBar label="Rechercher un plan" suggestions={options} />)

        fireEvent.click(getInput())

        expect(screen.getByRole('listbox')).toBeDefined()
        expect(getInput().getAttribute('aria-expanded')).toBe('true')
        expect(
            screen.getAllByRole('option').map((option) => option.textContent)
        ).toEqual(['Chaufferie', 'RC St Junien', 'BIO2 St Gaudens'])
    })

    it('restricts the suggestions to those matching what is typed', () => {
        render(<SearchBar label="Rechercher un plan" suggestions={options} />)
        fireEvent.click(getInput())

        type('st')

        expect(
            screen.getAllByRole('option').map((option) => option.textContent)
        ).toEqual(['RC St Junien', 'BIO2 St Gaudens'])
    })

    it('closes the panel when nothing matches what is typed', () => {
        render(<SearchBar label="Rechercher un plan" suggestions={options} />)
        fireEvent.click(getInput())

        type('zzz')

        expect(screen.queryByRole('listbox')).toBeNull()
    })

    it('reopens the panel when a letter is removed after Enter closed it', () => {
        render(<SearchBar label="Rechercher un plan" suggestions={options} />)
        fireEvent.click(getInput())

        type('chaufx')
        fireEvent.submit(getInput())
        expect(screen.queryByRole('listbox')).toBeNull()

        type('chauf')

        expect(
            screen.getAllByRole('option').map((option) => option.textContent)
        ).toEqual(['Chaufferie'])
    })

    it('opens the suggestion panel when the field is reached with the keyboard', () => {
        render(<SearchBar label="Rechercher un plan" suggestions={options} />)

        fireEvent.focus(getInput())

        expect(screen.getByRole('listbox')).toBeDefined()
    })

    it('opens no panel when there is nothing to suggest', () => {
        render(<SearchBar label="Rechercher un plan" />)

        const field = screen.getByRole('searchbox', {
            name: 'Rechercher un plan',
        })
        fireEvent.click(field)

        expect(screen.queryByRole('listbox')).toBeNull()
    })

    it('is a plain search field, not a list, when there is nothing to suggest', () => {
        render(<SearchBar label="Rechercher un plan" />)

        const field = screen.getByRole('searchbox', {
            name: 'Rechercher un plan',
        })

        expect(screen.queryByRole('combobox')).toBeNull()
        expect(field.hasAttribute('aria-expanded')).toBe(false)
        expect(field.hasAttribute('aria-controls')).toBe(false)
        expect(field.hasAttribute('aria-autocomplete')).toBe(false)
    })

    it('closes the suggestion panel when a click lands outside it', () => {
        render(<SearchBar label="Rechercher un plan" suggestions={options} />)
        fireEvent.click(getInput())

        // The component dismisses on `mousedown`, not `click`.
        fireEvent.mouseDown(document.body)

        expect(screen.queryByRole('listbox')).toBeNull()
    })

    it('closes the suggestion panel when Escape is pressed', () => {
        render(<SearchBar label="Rechercher un plan" suggestions={options} />)
        fireEvent.click(getInput())

        fireEvent.keyDown(getInput(), { key: 'Escape' })

        expect(screen.queryByRole('listbox')).toBeNull()
    })

    it('searches for a suggestion when it is picked', () => {
        const onSearch = vi.fn()
        render(
            <SearchBar
                label="Rechercher un plan"
                suggestions={options}
                onSearch={onSearch}
            />
        )
        fireEvent.click(getInput())

        fireEvent.click(screen.getByRole('option', { name: 'RC St Junien' }))

        expect(screen.queryByRole('listbox')).toBeNull()
        expect(getInput().value).toBe('RC St Junien')
        expect(onSearch).toHaveBeenCalledWith('RC St Junien')
    })

    it('closes the suggestion panel when the search button is clicked', () => {
        render(<SearchBar label="Rechercher un plan" suggestions={options} />)
        fireEvent.click(getInput())

        fireEvent.click(getButton())

        expect(screen.queryByRole('listbox')).toBeNull()
    })

    it('closes the suggestion panel when the field is submitted with Enter', () => {
        render(<SearchBar label="Rechercher un plan" suggestions={options} />)
        fireEvent.click(getInput())

        fireEvent.submit(getInput())

        expect(screen.queryByRole('listbox')).toBeNull()
    })

    it('keeps what the user types in the field', () => {
        render(<SearchBar label="Rechercher un plan" suggestions={options} />)

        type('chauf')

        expect(getInput().value).toBe('chauf')
    })

    it('reports the query when the search button is clicked', () => {
        const onSearch = vi.fn()
        render(<SearchBar label="Rechercher un plan" onSearch={onSearch} />)

        type('chauf')
        fireEvent.click(getButton())

        expect(onSearch).toHaveBeenCalledWith('chauf')
    })

    it('reports the query when the field is submitted with Enter', () => {
        const onSearch = vi.fn()
        render(<SearchBar label="Rechercher un plan" onSearch={onSearch} />)

        type('chauf')
        fireEvent.submit(getInput())

        expect(onSearch).toHaveBeenCalledWith('chauf')
    })

    it('reports an empty query rather than nothing at all', () => {
        const onSearch = vi.fn()
        render(<SearchBar label="Rechercher un plan" onSearch={onSearch} />)

        fireEvent.click(getButton())

        expect(onSearch).toHaveBeenCalledWith('')
    })

    it('survives a search with no handler', () => {
        render(<SearchBar label="Rechercher un plan" />)

        expect(() => fireEvent.click(getButton())).not.toThrow()
    })

    it('adds the hint to the name of the field', () => {
        render(
            <SearchBar label="Rechercher un plan" hint="Sur le nom du plan" />
        )

        expect(
            screen.getByRole('searchbox', {
                name: /^Rechercher un plan\s*Sur le nom du plan$/,
            })
        ).toBeDefined()
    })

    it('puts the label outside the search form only when it is shown', () => {
        const { rerender } = render(<SearchBar label="Rechercher un plan" />)
        const labelInForm = () =>
            screen.getByRole('search').querySelector('label') !== null

        expect(labelInForm()).toBe(true)

        rerender(<SearchBar label="Rechercher un plan" showLabel />)

        expect(labelInForm()).toBe(false)
        expect(getInput()).toBeDefined()
    })
})

describe('SearchBar, matching what is typed', () => {
    const accentedOptions: readonly string[] = [
        'Chaufferie',
        'Chaufferie Hôpital Tulle',
        'Réseau de chaleur Brive',
        'ÉGLETONS',
    ]

    const suggestionsFor = (text: string) => {
        render(
            <SearchBar
                label="Rechercher un plan"
                suggestions={accentedOptions}
            />
        )
        fireEvent.click(getInput())
        type(text)

        return screen
            .queryAllByRole('option')
            .map((option) => option.textContent)
    }

    it('ignores the case of what is typed', () => {
        expect(suggestionsFor('CHAUFFERIE')).toEqual([
            'Chaufferie',
            'Chaufferie Hôpital Tulle',
        ])
    })

    it('finds an accented label from a query typed without accents', () => {
        expect(suggestionsFor('reseau')).toEqual(['Réseau de chaleur Brive'])
    })

    it('finds a label without accents from an accented query', () => {
        expect(suggestionsFor('chaufférie')).toEqual([
            'Chaufferie',
            'Chaufferie Hôpital Tulle',
        ])
    })

    it('ignores case and accents together', () => {
        expect(suggestionsFor('HOPITAL')).toEqual(['Chaufferie Hôpital Tulle'])
        cleanup()
        expect(suggestionsFor('egletons')).toEqual(['ÉGLETONS'])
    })

    it('still leaves out the labels that do not match', () => {
        expect(suggestionsFor('brivé')).toEqual(['Réseau de chaleur Brive'])
    })
})
