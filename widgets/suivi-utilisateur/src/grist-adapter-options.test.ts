import { afterEach, describe, expect, it, vi } from 'vitest'

// The port registers its configuration screen with the Grist handshake, which
// is module state that happens once per page: each test gets a fresh copy.
async function freshOptionsPort() {
    vi.resetModules()
    const { createGristOptionsPort } = await import('./grist-adapter-options')
    return createGristOptionsPort()
}

type OptionsHandler = (
    options: unknown,
    settings: { accessLevel: string }
) => void

function mockGrist(savedOptions: Record<string, unknown> = {}) {
    const options = { ...savedOptions }
    const optionsHandlers: OptionsHandler[] = []
    let editOptions: (() => void) | undefined

    // Like the real message, it only reaches the handlers registered by then.
    const sendOptions = () => {
        for (const handler of optionsHandlers)
            handler(options, { accessLevel: 'full' })
    }

    const setOption = vi.fn((key: string, value: unknown) => {
        options[key] = value
        return Promise.resolve()
    })

    vi.stubGlobal('grist', {
        // Grist answers `ready` with a first message carrying the options.
        ready: vi.fn(({ onEditOptions }: { onEditOptions?: () => void }) => {
            editOptions = onEditOptions
            queueMicrotask(sendOptions)
        }),
        onOptions: (handler: OptionsHandler) => {
            optionsHandlers.push(handler)
        },
        getOption: (key: string) => Promise.resolve(options[key]),
        setOption,
    })

    return {
        setOption,
        // What Grist does when « Ouvrir la configuration » is clicked.
        openConfiguration: () => editOptions?.(),
        // What Grist does when the options are set, saved or reverted.
        sendOptions,
    }
}

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('createGristOptionsPort', () => {
    it('reads the number of users saved with the widget', async () => {
        mockGrist({ nombreUtilisateurs: 120 })
        const port = await freshOptionsPort()

        await expect(port.read()).resolves.toEqual({ nombreUtilisateurs: 120 })
    })

    it('reads no number of users from a widget never configured', async () => {
        mockGrist()
        const port = await freshOptionsPort()

        await expect(port.read()).resolves.toEqual({ nombreUtilisateurs: null })
    })

    it.each([0, -3, 2.5, '120', null])(
        'reads no number of users from %j',
        async (saved) => {
            mockGrist({ nombreUtilisateurs: saved })
            const port = await freshOptionsPort()

            await expect(port.read()).resolves.toEqual({
                nombreUtilisateurs: null,
            })
        }
    )

    it('saves the number of users with the widget', async () => {
        const { setOption } = mockGrist()
        const port = await freshOptionsPort()

        await port.save({ nombreUtilisateurs: 80 })

        expect(setOption).toHaveBeenCalledWith('nombreUtilisateurs', 80)
        await expect(port.read()).resolves.toEqual({ nombreUtilisateurs: 80 })
    })

    it('tells its listeners when Grist asks to configure the widget', async () => {
        const { openConfiguration } = mockGrist()
        const port = await freshOptionsPort()
        const listener = vi.fn()

        port.onEdit(listener)
        await port.read()
        openConfiguration()

        expect(listener).toHaveBeenCalledOnce()
    })

    it('stops telling a listener that unsubscribed', async () => {
        const { openConfiguration } = mockGrist()
        const port = await freshOptionsPort()
        const listener = vi.fn()

        const unsubscribe = port.onEdit(listener)
        await port.read()
        unsubscribe()
        openConfiguration()

        expect(listener).not.toHaveBeenCalled()
    })
})

describe('createGristOptionsPort().onChange', () => {
    it('tells its listeners each time Grist sends the options again', async () => {
        const { sendOptions } = mockGrist()
        const port = await freshOptionsPort()
        const listener = vi.fn()

        port.onChange(listener)
        await port.read()
        sendOptions()
        sendOptions()

        expect(listener).toHaveBeenCalledTimes(2)
    })

    // The handshake's message carries the options the widget is reading
    // anyway: reporting it as a change would read everything twice.
    it('does not count the handshake as a change', async () => {
        mockGrist()
        const port = await freshOptionsPort()
        const listener = vi.fn()

        port.onChange(listener)
        await port.read()

        expect(listener).not.toHaveBeenCalled()
    })

    it('stops telling a listener that unsubscribed', async () => {
        const { sendOptions } = mockGrist()
        const port = await freshOptionsPort()
        const listener = vi.fn()

        const unsubscribe = port.onChange(listener)
        await port.read()
        unsubscribe()
        sendOptions()

        expect(listener).not.toHaveBeenCalled()
    })
})
