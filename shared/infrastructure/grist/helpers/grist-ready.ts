import {
    AccessDeniedError,
    DataSourceUnavailableError,
} from '@shared/core/errors'

const REQUIRED_ACCESS = 'full'

const HANDSHAKE_TIMEOUT_MS = 2000

let handshake: Promise<void> | undefined
let grantedAccess = ''
let editOptions: (() => void) | undefined

/**
 * Gives the widget a configuration screen: Grist adds « Ouvrir la
 * configuration » to the widget's creator panel, and calls `handler` when it is
 * clicked. Grist only hears about it in the handshake, which happens once, so
 * this has to run before the first `gristReady()`.
 */
export function onGristEditOptions(handler: () => void): void {
    if (handshake) {
        throw new Error(
            'onGristEditOptions() must be called before the first gristReady().'
        )
    }
    editOptions = handler
}

export async function gristReady(): Promise<void> {
    if (typeof grist === 'undefined') {
        throw new DataSourceUnavailableError(
            'The Grist Plugin API is unavailable.'
        )
    }

    handshake ??= new Promise<void>((resolve, reject) => {
        const givingUp = setTimeout(
            () =>
                reject(
                    new DataSourceUnavailableError(
                        `Grist did not answer within ${HANDSHAKE_TIMEOUT_MS}ms — this page is probably not open in Grist.`
                    )
                ),
            HANDSHAKE_TIMEOUT_MS
        )

        grist.onOptions((_options, settings) => {
            clearTimeout(givingUp)
            grantedAccess = settings.accessLevel
            resolve()
        })
        grist.ready({
            requiredAccess: REQUIRED_ACCESS,
            onEditOptions: editOptions,
        })
    })

    await handshake

    if (grantedAccess !== REQUIRED_ACCESS) {
        throw new AccessDeniedError(
            `Grist granted "${grantedAccess}" access, "${REQUIRED_ACCESS}" is required.`
        )
    }
}
