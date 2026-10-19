import { afterEach, describe, expect, it, vi } from 'vitest'

// The handshake is module state, kept for the page's whole life: each test
// gets a fresh copy of the module so that one test's handshake is not the next
// one's.
async function freshGristReady() {
    vi.resetModules()
    return import('./grist-ready')
}

function mockGrist() {
    const ready = vi.fn()

    vi.stubGlobal('grist', {
        ready,
        onOptions: (
            handler: (
                options: unknown,
                settings: { accessLevel: string }
            ) => void
        ) => handler({}, { accessLevel: 'full' }),
    })

    return { ready }
}

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('gristReady', () => {
    it('offers no configuration screen by default', async () => {
        const { ready } = mockGrist()
        const { gristReady } = await freshGristReady()

        await gristReady()

        expect(ready).toHaveBeenCalledWith({
            requiredAccess: 'full',
            onEditOptions: undefined,
        })
    })

    it('hands Grist the configuration screen registered beforehand', async () => {
        const { ready } = mockGrist()
        const { gristReady, onGristEditOptions } = await freshGristReady()
        const openConfiguration = vi.fn()

        onGristEditOptions(openConfiguration)
        await gristReady()

        expect(ready).toHaveBeenCalledWith({
            requiredAccess: 'full',
            onEditOptions: openConfiguration,
        })
    })

    // Grist only reads the handler from the first `ready` call: registered any
    // later, the « Ouvrir la configuration » button would silently never show.
    it('refuses a configuration screen registered after the handshake', async () => {
        mockGrist()
        const { gristReady, onGristEditOptions } = await freshGristReady()

        await gristReady()

        expect(() => onGristEditOptions(vi.fn())).toThrow(/before/)
    })
})
