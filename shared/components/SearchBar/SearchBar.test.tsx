import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SearchBar from './SearchBar'
import type { SearchBarOption } from './SearchBar.types'

const options: readonly SearchBarOption<string>[] = [
    { value: 'chaufferie', label: 'Chaufferie' },
    { value: 'rc-st-junien', label: 'RC St Junien' },
    { value: 'bio2-st-gaudens', label: 'BIO2 St Gaudens' },
]

afterEach(() => {
    cleanup()
})

const getInput = () =>
    screen.getByRole<HTMLInputElement>('combobox', {
        name: 'Rechercher un plan',
    })

const getButton = () => screen.getByRole('button', { name: 'Rechercher' })

const type = (text: string) =>
    fireEvent.change(getInput(), { target: { value: text } })

describe('SearchBar', () => {
    it('keeps the suggestion panel closed until the field is clicked', () => {
        render(<SearchBar label="Rechercher un plan" options={options} />)

        expect(screen.queryByRole('listbox')).toBeNull()
        expect(getInput().getAttribute('aria-expanded')).toBe('false')
    })

    it('opens the suggestion panel with its options when the field is clicked', () => {
        render(<SearchBar label="Rechercher un plan" options={options} />)

        fireEvent.click(getInput())

        expect(screen.getByRole('listbox')).toBeDefined()
        expect(getInput().getAttribute('aria-expanded')).toBe('true')
        expect(
            screen.getAllByRole('option').map((option) => option.textContent)
        ).toEqual(['Chaufferie', 'RC St Junien', 'BIO2 St Gaudens'])
    })

    it('restricts the suggestions to those matching what is typed', () => {
        render(<SearchBar label="Rechercher un plan" options={options} />)
        fireEvent.click(getInput())

        type('st')

        expect(
            screen.getAllByRole('option').map((option) => option.textContent)
        ).toEqual(['RC St Junien', 'BIO2 St Gaudens'])
    })

    it('closes the panel when nothing matches what is typed', () => {
        render(<SearchBar label="Rechercher un plan" options={options} />)
        fireEvent.click(getInput())

        type('zzz')

        expect(screen.queryByRole('listbox')).toBeNull()
    })

    it('reopens the panel when a letter is removed after Enter closed it', () => {
        render(<SearchBar label="Rechercher un plan" options={options} />)
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
        render(<SearchBar label="Rechercher un plan" options={options} />)

        // Tabbing into the field fires `focus` and no click at all, so the two
        // handlers are not interchangeable.
        fireEvent.focus(getInput())

        expect(screen.getByRole('listbox')).toBeDefined()
    })

    it('opens no panel when there is nothing to suggest', () => {
        render(<SearchBar label="Rechercher un plan" />)

        fireEvent.click(getInput())

        // Asking for the panel is not enough to get one: an empty list is
        // nothing to draw, and `aria-expanded` would be announcing a list that
        // is not there.
        expect(screen.queryByRole('listbox')).toBeNull()
        expect(getInput().getAttribute('aria-expanded')).toBe('false')
    })

    it('closes the suggestion panel when a click lands outside it', () => {
        render(<SearchBar label="Rechercher un plan" options={options} />)
        fireEvent.click(getInput())

        // `mousedown` rather than `click`: that is the event the component
        // dismisses on, and firing `click` alone would not pass at all.
        fireEvent.mouseDown(document.body)

        expect(screen.queryByRole('listbox')).toBeNull()
    })

    it('closes the suggestion panel when Escape is pressed', () => {
        render(<SearchBar label="Rechercher un plan" options={options} />)
        fireEvent.click(getInput())

        fireEvent.keyDown(getInput(), { key: 'Escape' })

        expect(screen.queryByRole('listbox')).toBeNull()
    })

    it('closes the suggestion panel when an option is picked', () => {
        const onSelect = vi.fn()
        render(
            <SearchBar
                label="Rechercher un plan"
                options={options}
                onSelect={onSelect}
            />
        )
        fireEvent.click(getInput())

        fireEvent.click(screen.getByRole('option', { name: 'RC St Junien' }))

        expect(screen.queryByRole('listbox')).toBeNull()
        // The choice is made, so it belongs in the field — and the caller gets
        // the option's value, not its label.
        expect(getInput().value).toBe('RC St Junien')
        expect(onSelect).toHaveBeenCalledWith('rc-st-junien')
    })

    it('closes the suggestion panel when the search button is clicked', () => {
        render(<SearchBar label="Rechercher un plan" options={options} />)
        fireEvent.click(getInput())

        fireEvent.click(getButton())

        expect(screen.queryByRole('listbox')).toBeNull()
    })

    it('closes the suggestion panel when the field is submitted with Enter', () => {
        render(<SearchBar label="Rechercher un plan" options={options} />)
        fireEvent.click(getInput())

        fireEvent.submit(getInput())

        expect(screen.queryByRole('listbox')).toBeNull()
    })

    it('keeps what the user types in the field', () => {
        render(<SearchBar label="Rechercher un plan" options={options} />)

        type('chauf')

        // The field is controlled, so its value is only what the component put
        // back — this fails outright if the change never reaches the state.
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
        // Enter in a field submits its form, which is the whole reason the
        // search bar is a `<form>` — the button and the keyboard land on one
        // handler rather than two.
        fireEvent.submit(getInput())

        expect(onSearch).toHaveBeenCalledWith('chauf')
    })

    it('reports an empty query rather than nothing at all', () => {
        const onSearch = vi.fn()
        render(<SearchBar label="Rechercher un plan" onSearch={onSearch} />)

        fireEvent.click(getButton())

        // Searching for nothing is a search: it is what clears a filter, and
        // the caller cannot do that if the submit is swallowed here.
        expect(onSearch).toHaveBeenCalledWith('')
    })

    it('survives a search with no handler', () => {
        render(<SearchBar label="Rechercher un plan" />)

        expect(() => fireEvent.click(getButton())).not.toThrow()
    })
})
