import {
    AccessDeniedError,
    DataSourceUnavailableError,
} from '@shared/core/errors'

const REQUIRED_ACCESS = 'full'

let handshake: Promise<void> | undefined
let grantedAccess = ''

export async function gristReady(): Promise<void> {
    if (typeof grist === 'undefined') {
        throw new DataSourceUnavailableError(
            'The Grist Plugin API is unavailable.'
        )
    }

    handshake ??= new Promise<void>((resolve) => {
        grist.onOptions((_options, settings) => {
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
