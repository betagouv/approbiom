import type { AccessTokenResult } from 'grist/GristAPI'
import { gristReady } from './grist-ready'

export async function getAccessToken({
    disableReadOnly = false,
}: {
    disableReadOnly?: boolean
} = {}): Promise<AccessTokenResult> {
    await gristReady()

    return grist.docApi.getAccessToken({
        readOnly: disableReadOnly ? false : true,
    })
}
