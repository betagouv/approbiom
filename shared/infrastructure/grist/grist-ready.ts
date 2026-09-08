import {
    AccessDeniedError,
    DataSourceUnavailableError,
} from '@shared/core/errors'

const REQUIRED_ACCESS = 'full'

const HANDSHAKE_TIMEOUT_MS = 2000

let handshake: Promise<void> | undefined
let grantedAccess = ''

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
        grist.ready({ requiredAccess: REQUIRED_ACCESS })
    })

    await handshake

    if (grantedAccess !== REQUIRED_ACCESS) {
        throw new AccessDeniedError(
            `Grist granted "${grantedAccess}" access, "${REQUIRED_ACCESS}" is required.`
        )
    }
}
