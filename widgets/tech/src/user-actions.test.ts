import { describe, expect, it } from 'vitest'
import { parseUserActions } from './user-actions'

describe('parseUserActions', () => {
    it('wraps a single action in a list', () => {
        expect(parseUserActions('["AddTable", "Test", []]')).toEqual([
            ['AddTable', 'Test', []],
        ])
    })

    it('keeps a list of actions as it is', () => {
        expect(
            parseUserActions(
                '[["AddTable", "Test", []], ["RemoveTable", "Test"]]'
            )
        ).toEqual([
            ['AddTable', 'Test', []],
            ['RemoveTable', 'Test'],
        ])
    })

    it('rejects what is not an action', () => {
        expect(() => parseUserActions('{"AddTable": "Test"}')).toThrow()
        expect(() => parseUserActions('[]')).toThrow()
    })

    it('rejects invalid JSON', () => {
        expect(() => parseUserActions('["AddTable",')).toThrow()
    })
})
